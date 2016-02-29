"use strict";

var request = require('supertest'),
	express = require('../index'),
	_ = require('lodash'),
	app = express.app,
	server = express.server,
	testEntries = [],
	Promise = global.Promise,
	assert = require('chai').assert;


function getEntry(id) {
	return new Promise(function(resolve, reject){
		// search the first tier in the DB to use as parent
		request(app)
			.get('/api/tiers/')
			.expect('Content-Type', /json/)
			.expect(200)
			.end(function(err, res){
				var entry = (function(){
					if(id){
						if(typeof id === 'string'){
							return _.find(res.body.tiers, {_id:id});
						}
						else{
							return _.find(res.body.tiers, {_id:id._id});
						}
					}
					return res.body.tiers[1];
				}());

				if(err || !entry){
					err = err || {message:' no entry found'};
					reject(new Error('Can\'t GET entry: '+err.message));
				}
				else{
					resolve(entry);
				}
			});
	});
}

function createEntryWithParam(params) {
	params = params || {};

	var title = params.title || 'tier-for-test',
		href = params.href || '#testing',
		sort = params.sort || null;

	return function createEntry(parent){
		return new Promise(function(resolve,reject){
			var parentId = typeof parent === 'string' ? parent : parent._id;

			request(app)
			.post('/api/tiers/')
			.set('Content-Type', 'application/json')
			.send({"tier":{"title":title,"href":href,parent:parentId,"sort":sort}})
			.expect('Content-Type', /json/)
			.expect(201)
			.expect(function (res) {
				if(res.body.tier){
					testEntries.push(res.body.tier._id);
				}
				assert.equal(res.body.tier.title, title);
				assert.equal(res.body.tier.href, href);
				assert.equal(res.body.tier.parent, parentId);
			})
			.end(function(err, res){
				if(err){
					return reject(err);
				}
				else{
					resolve(res.body.tier);
				}
			});
		});
	};
}

function deleteEntry(id) {
	id = typeof id === 'string' ? id : id._id;
	return new Promise(function (resolve, reject) {
		request(app)
			.delete('/api/tiers/'+id)
			.expect(function (res) {
				if(res.status !== 204 && res.status !== 304){
					throw(new Error('Status is '+ res.status));
				}
			})
			.end(function(err, res){
				if(err){
					reject(err);
				}
				else{
					_.remove(testEntries,function (ele) {
						return ele === id;
					});
					resolve(id);
				}
			});
	});
}

function updateEntry(id,params) {
	return new Promise(function (resolve, reject) {
		request(app)
			.put('/api/tiers/'+id)
			.set('Content-Type', 'application/json')
			.send({"tier":{"title":params.title,"href":params.href,parent:params.parent,"sort":params.sort}})
			.expect(200)
			.expect('Content-Type', /json/)
			.expect(function (res) {
				if(!res.body && !res.body.tiers){
					throw(new Error('response content is not correct'));
				}
			})
			.end(function(err, res){
				if(err){
					reject(err);
				}
				else{
					resolve(res.body.tiers);
				}
			});
	});
}

var createEntry = createEntryWithParam();


//////////////////start tests

describe('GET /api/tiers', function(){
	it('should return 200 and the "tiers" json', function (done) {
		request(app)
			.get('/api/tiers/')
			.expect('Content-Type', /json/)
			.expect(function (res) {
				if(!res.body && !res.body.tiers){
					throw(new Error('response content is not correct'));
				}
			})
			.expect(200, done);
	});
	it('should return 404 for inexistent entry (wrong id)', function (done) {
		request(app)
			.get('/api/tiers/procione')
			.expect(404, done);
	});
	it('should return 200 and the "tier" json for existent entry', function (done) {
		getEntry()
		.then(function (entry) {
			return new Promise(function (resolve, reject) {
				request(app)
					.get('/api/tiers/'+entry._id)
					.expect('Content-Type', /json/)
					.expect(function (res) {
						if(!res.body && !res.body.tier && res.body.tier._id !== entry._id){
							throw(new Error('response content is not correct'));
						}
					})
					.end(function(err, res){
						if(err){
							reject(err);
						}
						else{
							resolve();
						}
					});
			});
		})
		.then(function () {
			done();
		})
		.catch(function(err){
			done(err);
		});
	});

});

describe('post /api/tiers', function(){
	it('"parent" parameter wrong (entry inexistent), shold return 304', function (done) {
		request(app)
			.post('/api/tiers/')
			.set('Content-Type', 'application/json')
			.send({"tier":{"title":"tier-for-test","href":"testing","parent":'caccona',"sort":null}})
			// .expect('Content-Type', /json/)
			.expect(304, done);
	});

	it('post without "parent" parameter, 500 and error "parameter wrong"', function (done) {
		request(app)
			.post('/api/tiers/')
			.set('Content-Type', 'application/json')
			.send({"tier":{"title":"tier-for-test","href":"testing","sort":null}})
			.expect('Content-Type', /json/)
			.expect(500, done);
	});

	it('entry added to the DB', function (done) {
		getEntry()
		.then(createEntry)
		.then(getEntry) // chech if the tier really exist on the db
		.then(function () {
			done();
		})
		.catch(function(err){
			done(err);
		});
	});

	it('new entry id is added to the parent.children array', function (done) {
		var childId;

		getEntry() //get the first entry
		.then(createEntry) //create a newEntry using the first entry as parent
		.then(function (newEntry) {
			childId = newEntry._id;
			return getEntry(newEntry.parent); //get again the parent entry, since it is changed (new child)
		})
		.then(function (parent) {
			//check if the new child really exist on the parent
			if(parent.children.indexOf(childId) === -1){
				throw(new Error('children._id is not present in the parent.children array'));
			}
			return parent;
		})
		.then(function () {
			done();
		})
		.catch(function(err){
			done(err);
		});
	});

	it('"sort" parameter works fine', function (done) {
		var childId;

		getEntry() //get the first entry
		.then(createEntry) //create a newEntry using the first entry as parent
		.then(function (newEntry) {
			return createEntry(newEntry.parent); //second child
		})
		.then(function (newEntry) {
			return createEntryWithParam({sort:1})(newEntry.parent); //third child at second position
		})
		.then(function (newEntry) {
			childId = newEntry._id;  // store the id of the last entry created
			return getEntry(newEntry.parent); // get the parent
		})
		.then(function (parent) {
			if(parent.children.indexOf(childId) !== 1){
				// index is not as expected
				throw(new Error('wrong index'));
			}
		})
		.then(function () {
			done();
		})
		.catch(function(err){
			done(err);
		});
	});
});


describe('put /api/tiers', function(){
	it('fail if fake id', function (done) {
		request(app)
			.put('/api/tiers/procione')
			.set('Content-Type', 'application/json')
			.send({"tier":{"title":'tier-for-test',"href":"#testing",parent:null,"sort":1}})
			.expect(304, done);
	});

	it('the entry changes accordingly', function (done) {
		var firstParentId;
		var secondParentId;
		var entryId;
		var rootEntry;

		function createSeconParent(parent) {
			// create a entry with 2 children, and return the entry
			var entryToReturn;
			return createEntry(parent) //the entry
				.then(function (entry) {
					entryToReturn = entry;
					return createEntry(entry);
				}) //first child
				.then(function (newEntry) {
					return createEntry(newEntry.parent); //second child
				})
				.then(function () {
					return entryToReturn;
				});
		}

		// we create 2 three to check if the changing of the parent works
		getEntry()
		.then(function (entry) {
			rootEntry = entry;
			return entry;
		})
		.then(createSeconParent)
		.then(function (entry) {
			secondParentId = entry._id;
			return createEntry(rootEntry); //create the entry to test on the rootEntry
		})
		.then(function (newEntry) {
			firstParentId = newEntry.parent;
			entryId = newEntry._id;
			return updateEntry(newEntry._id,{title:'modified',href:'#modified',parent:secondParentId, sort:1});
		})
		.then(function (tiers) {
			var entry = _.find(tiers, {_id:entryId}),
				parent = _.find(tiers, {_id:entry.parent}),
				index = parent.children.indexOf(entry._id),
				firstParent = _.find(tiers, {_id:firstParentId}),
				isStillInFirstParent = firstParent.children.indexOf(entryId) !== -1;

			assert.isOk(entry, 'entry not found');
			assert.equal(index, 1, 'index of the entry');
			assert.isNotTrue(isStillInFirstParent, 'id child still in old parent');
			assert.equal(entry.title, 'modified', 'title');
			assert.equal(entry.href, '#modified', 'href');
			assert.equal(entry.parent, secondParentId, 'parent');

		})
		.then(function () {
			done();
		})
		.catch(function(err){
			done(err);
		});
	});

});

describe('delete /api/tiers', function(){
	it('304 because entry doesn\'t exist (wrong id)', function (done) {
		request(app)
			.delete('/api/tiers/procione')
			.expect(304, done);
	});

	it('it creates and entry, it removes it, and check the presence on the db', function (done) {

		getEntry()
		.then(createEntry)
		.then(deleteEntry)
		.then(function (id) {
			return new Promise(function(resolve, reject){
				request(app)
					.get('/api/tiers/' + id)
					.expect(404)
					.end(function(err, res){
						if(err){
							reject(err);
						}
						else{
							resolve();
						}
					});
			});
		})
		.then(function () {
			done();
		})
		.catch(function(err){
			done(err);
		});
	});
});

describe('get /api/fill-standard', function(){
	it('it reset the db', function (done) {
		new Promise(function (resolve, reject) {
			request(app)
				.get('/api/fill-standard')
				.expect(200)
				.end(function(err, res){
					if(err){
						reject(err);
					}
					else{
						resolve();
					}
				});
		})
		.then(function () {
			return new Promise(function(resolve, reject){
				request(app)
					.get('/api/tiers/')
					.expect('Content-Type', /json/)
					.expect(200)
					.expect(function (res) {
						var entries = res.body.tiers;
						assert.isOk(_.find(entries, {"title":'last tier'}));
						assert.equal(entries.length, 8);
					})
					.end(function(err, res){
						if(err){
							reject(new Error('db changed badly ' + err));
						}
						else{
							resolve();
						}
					});
			});
		})
		.then(function () {
			done();
		})
		.catch(function(err){
			done(err);
		});
	});
});

server.close();
