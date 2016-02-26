var express = require("express");
var router = express.Router();


router.get('/',function(req,res,next){
	console.log("entra get");
	var tiers = res.locals.tiers;
	var resJson = {};
	console.log('entra get');
	var trowError = function(err){
		res.send({"errore":err});
		res.end();
	};

	res.locals.returnCompleteTiers(tiers,res);
});


router.post("/",function(req,res,next){
	console.log('entra post '+ JSON.stringify(req.body));
	var tiers = res.locals.tiers;
	var params = req.body.tier;
	var parent_id;
	var mongoose = res.locals.mongoose;
	var newTierId = mongoose.Types.ObjectId();
	var resJson = {};
	var newTier;

	console.log('entra post')

	var title = params.title && params.title !== '' ? params.title : 'da riempire';

	tiers.create({
		_id:newTierId,
		title:title,
		href:params.href,
		children:params.children || [],
		parent:mongoose.Types.ObjectId(params.parent)
	})
	.then(function(tier){
		newTier = tier;
		console.log('parente '+ tier.parent)
		return tiers.find({_id:tier.parent});
	})
	.then(function(parent){
		console.log('second then ' + parent._id)


		parent = Array.isArray(parent) ? parent[0] : parent;
		console.log('second then ddd')
		children = parent.children;
		console.log('second then dssds')
		console.log(params.sort)
		console.log(3223232)
		console.log(children)
		console.log(00000)
		var sort = !params.sort || params.sort > children.length ? children.length : params.sort;
		console.log('appendi in ' + sort)
		// parent.children.splice(params.sort, 0, tier_id);
		parent.children.splice(sort, 0, newTierId);
		console.log('second then dldldld')

		return parent.save();
	})
	.then(function(){
		console.log('third then')
		res.send({"tier":newTier});
		res.end();
	})

});

router.delete("/",function(req,res,next){
	console.log('entra delete')
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
				console.log('cancella ' + tier._id);
				return childrenArr.reduce(function(memo,current){
					return memo.then(function(){
						return removeAll(current);
					})
				}, tier.remove());
			}
			else{
				console.log('cancella ' + tier._id)
				return tier.remove();
			}

		});
	}	
		
	removeAll(tier_id)
	.then(function(){
		// searc the parent
		return tiers.find({children:mongoose.Types.ObjectId(tier_id)});
	})
	.then(function(parent){
		// remove the parent
		parent = Array.isArray(parent) ? parent[0] : parent;
		var children = parent.children;
		var childIndex = children.indexOf(tier_id);
		if(childIndex !== -1){
			children.splice(childIndex,1);
		}
		return parent.save();
	})
	.then(function(){
		console.log('fine')
		res.send({});
		res.end();
	})

	;
});


router.put('/',function(req,res,next){
	var mongoose = res.locals.mongoose;
	var tiers = res.locals.tiers;
	var tiers_arr = req.originalUrl.split('/');
	var tier_id = tiers_arr[tiers_arr.length - 1];
	var params = req.body.tier;
	var oldParentId;
	var currentParentId;


	console.log(JSON.stringify(params));

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
		console.log('id figlio '+ tier_id);
		return tiers.find({children:mongoose.Types.ObjectId(tier_id)});
	})
	.then(function(oldParent){
		console.log('la dell old '+oldParent.length)
		oldParent = Array.isArray(oldParent) ? oldParent[0] : oldParent;
		console.log('la dell old2')
		var currentSort = oldParent.children.indexOf(mongoose.Types.ObjectId(tier_id));

		if(oldParentId === currentParentId && params.sort !== currentSort){
			console.log('same parent different sort');
			// same parent but different position, remove from the old position to add to the new;
			oldParent.children.splice(currentSort,1);
			oldParent.children.splice(params.sort, 0, mongoose.Types.ObjectId(tier_id));
			return oldParent.save();
		}
		else if(oldParentId !== currentParentId){
			console.log('different parent');
			// different parents

			// rimuovere dal vecchio parent
			console.log('rimuovere '+ tier_id)
			console.log('vecchio parent '+ oldParent.title);
			console.log('togliere da '+ currentSort);
			console.log('array children prima '+ oldParent.children);
			oldParent.children.splice(currentSort,1);
			console.log('array children dopo '+ oldParent.children);

			return oldParent.save()
				.then(function(){
					return tiers.findById(params.parent);
				})
				.then(function(newParent){
					newParent = Array.isArray(newParent) ? newParent[0] : newParent;
					newParent.children.splice(params.sort, 0, mongoose.Types.ObjectId(tier_id));
					return newParent.save();					
				})
		}
		else{
			console.log('nothing parent changes');
			return this;
		}
	})

	.then(function(){
		console.log('la dell end')
		res.locals.returnCompleteTiers(tiers,res);	
	})

});



module.exports = router;