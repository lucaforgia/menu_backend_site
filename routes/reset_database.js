var express = require('express');
var router = express.Router();

router.get('/', function(req,res,next){

	var tiers = res.locals.tiers;
	var mongoose = res.locals.mongoose;

	var rootId = mongoose.Types.ObjectId();

	var ObjectIds = [
		mongoose.Types.ObjectId(),
		mongoose.Types.ObjectId(),
		mongoose.Types.ObjectId(),
		mongoose.Types.ObjectId(),
		mongoose.Types.ObjectId(),
		mongoose.Types.ObjectId(),
		mongoose.Types.ObjectId(),
	];


	var newTiersObj = [
		{
			_id:rootId,
			title:"THE REAL ROOT",
			children:[ObjectIds[0],ObjectIds[1],ObjectIds[2],ObjectIds[3]]
		},
		{
			_id:ObjectIds[0],
			title:"first tier",
			href:'',
			parent:rootId,
			children:[ObjectIds[4],ObjectIds[5]],
		},
		{
			_id:ObjectIds[1],
			title:"second tier",
			href:'#second',
			parent:rootId,
		},
		{
			_id:ObjectIds[2],
			title:"third tier",
			href:'#third',
			parent:rootId,
		},
		{
			_id:ObjectIds[3],
			title:"fourth tier",
			href:'#fourth',
			parent:rootId,
		},
		{
			_id:ObjectIds[4],
			title:"fifth tier",
			href:'#fifth',
			parent:ObjectIds[0],
		},
		{
			_id:ObjectIds[5],
			title:"sixth tier",
			href:'',
			parent:ObjectIds[0],
			children:ObjectIds[6]
		},
		{
			_id:ObjectIds[6],
			title:"seventh tier",
			href:'#seventh',
			parent:ObjectIds[5],
		}
	];


	
	newTiersObj.reduce(function(memo,current){
		return memo.then(
			function(item){
				return new tiers(current).save();
			}
		);	
	}, tiers.remove({}))
	.then(function(){
		res.locals.returnCompleteTiers(tiers,res);	
	})
});


module.exports = router;