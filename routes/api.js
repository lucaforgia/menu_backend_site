"use strict";

var express = require("express");
var router = express.Router();

function returnCompleteTiers(tiers, res, err){
	var resJson = {};
	err = err || function(){};
	return tiers.find({})
		.then(function(all){
			res.status(200);
			res.send({"tiers":all});
			res.end();
	});
}

router.get('/',function(req,res,next){
	var tiers = res.locals.tiers;
	var resJson = {};
	returnCompleteTiers(tiers,res)
	.catch(function(err){
		res.status(404);
		res.send({});
		res.end();
	});
});

router.get('/*',function(req,res,next){
	var tiers = res.locals.tiers;
	var resJson = {};
	var url_arr = req.originalUrl.split('/');
	var tier_id = url_arr[url_arr.length - 1];
	tiers.findById(tier_id)
	.then(function (entry) {
		res.status(200);
		res.send({"tier":entry});
		res.end();
	})
	.catch(function(err){
		res.status(404);
		res.send({});
		res.end();
	});
});


router.post("/",function(req,res,next){
	//console.log('entra post '+ JSON.stringify(req.body));
	var tiers = res.locals.tiers;
	var params = req.body.tier;
	var parent_id;
	var mongoose = res.locals.mongoose;
	var newTierId = mongoose.Types.ObjectId();
	var resJson = {};
	var newTier;

	var title = params.title && params.title !== '' ? params.title : 'da riempire';
	if(params.parent && params.parent !== ''){
		tiers.find({_id:params.parent})
		.then(function(parent){
			parent = Array.isArray(parent) ? parent[0] : parent;
			var children = parent.children;
			var sort = !params.sort || params.sort > children.length ? children.length : params.sort;
			parent.children.splice(sort, 0, newTierId);
			return parent.save();
		})
		.then(function(){
			return tiers.create({
				_id:newTierId,
				title:title,
				href:params.href,
				children:params.children || [],
				parent:mongoose.Types.ObjectId(params.parent)
			});
		})
		.then(function(newTier){
			res.status(201);
			res.send({"tier":newTier});
			res.end();
		})
		.catch(function(err){
			res.status(304);
			res.send({"tier":{}});
			res.end();
		});
	}
	else{
		next(new Error('wrong parameters'));
	}
});

router.delete("/*",function(req,res,next){
	var tiers = res.locals.tiers;
	var url_arr = req.originalUrl.split('/');
	var tier_id = url_arr[url_arr.length - 1];
	var currentTier;
	var mongoose = res.locals.mongoose;

	var removeAll = function(id){
		// remove all also descendant
		return tiers.findById(id).then(function(tier){
			if(tier.children && Array.isArray(tier.children)){
				var childrenArr = tier.children.slice();
				return childrenArr.reduce(function(memo,current){
					return memo.then(function(){
						return removeAll(current);
					});
				}, tier.remove());
			}
			else{
				return tier.remove();
			}

		});
	};

	removeAll(tier_id)
	.then(function(){
		// searc the parent
		return tiers.find({children:mongoose.Types.ObjectId(tier_id)});
	})
	.then(function(parent){
		// remove the id from the parent "children" array
		parent = Array.isArray(parent) ? parent[0] : parent;
		var children = parent.children;
		var childIndex = children.indexOf(tier_id);
		if(childIndex !== -1){
			children.splice(childIndex,1);
		}
		return parent.save();
	})
	.then(function(){
		//console.log('fine')
		res.status(204);
		res.end();
	})
	.catch(function(err){
		// scenario: the id is wrong, so no entry is found. Or the entry has already been deleted with another ajax
		res.status(304);
		res.end();
	});
});


router.put('/*',function(req,res,next){
	var mongoose = res.locals.mongoose;
	var tiers = res.locals.tiers;
	var tiers_arr = req.originalUrl.split('/');
	var tier_id = tiers_arr[tiers_arr.length - 1];
	var params = req.body.tier;
	var oldParentId;
	var currentParentId;

	tiers.findById(tier_id)
	.then(function(tier){
		oldParentId = tier.parent.toString();
		currentParentId = params.parent;
		tier.href = params.href;
		tier.title = params.title;
		tier.parent = mongoose.Types.ObjectId(params.parent);

		return tier.save();
	})
	.then(function(){
		// cerca old parent;
		return tiers.find({children:mongoose.Types.ObjectId(tier_id)});
	})
	.then(function(oldParent){
		oldParent = Array.isArray(oldParent) ? oldParent[0] : oldParent;
		var currentSort = oldParent.children.indexOf(mongoose.Types.ObjectId(tier_id));

		if(oldParentId === currentParentId && params.sort !== currentSort){
			// same parent but different position, remove from the old position to add to the new;
			oldParent.children.splice(currentSort,1);
			oldParent.children.splice(params.sort, 0, mongoose.Types.ObjectId(tier_id));
			return oldParent.save();
		}
		else if(oldParentId !== currentParentId){
			// different parents
			oldParent.children.splice(currentSort,1);

			return oldParent.save()
				.then(function(){
					return tiers.findById(params.parent);
				})
				.then(function(newParent){
					newParent = Array.isArray(newParent) ? newParent[0] : newParent;
					newParent.children.splice(params.sort, 0, mongoose.Types.ObjectId(tier_id));
					return newParent.save();
				});
		}
		else{
			return this;
		}
	})
	.then(function(){
		returnCompleteTiers(tiers,res);
	})
	.catch(function(err){
		res.status(304);
		res.end();
	});
});



module.exports = router;
