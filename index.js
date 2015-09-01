var _ = require('lodash')
var request = require('superagent')
var util = require('./util')
var uuid = require('uuid')
var taurusCollection = require('taurus-mongo/lib/collection')





///////////////////////////
//           query
///////////////////////////

function *query() {
  //if( !this.request.body.todos ) return this.body = []
  //TODO 多个query
  var results = {}

  for (var queryName in this.request.body) {
    results[queryName] = yield taurusCollection.pull(this.request.body[queryName])
  }

  this.body = results
}


///////////////////////////
//           create
///////////////////////////


/*
 接受的数据结构
 [rawNode]{
 def : {
 type
 },
 data : {

 },
 $tracker : 'v0',
 $relations : [
 {
 key : {
 name,
 reverse
 },
 props : {},
 value : [rawNode]{}
 }
 ]

 }

 */



function *push() {
  this.body = yield taurusCollection.push(this.request.body.ast, this.request.body.rawNodesToSave, this.request.body.trackerRelationMap)
}

///////////////////////
//           destroy
///////////////////////
function *destroy(){
  console.log( "destroying===>",this.body )
  this.body = yield taurusCollection.destroy( this.request.body.type, this.request.body.id )
}



////////////////////////////
//               exports
////////////////////////////

var taurusModule = {
  backend: 'http://127.0.0.1:7474/db/data/transaction/commit',
  routes: {
    'POST /taurus/query': function*() {
      if (this.query.type === 'query') {
        return yield query.call(this)
      } else if (this.query.type === 'push') {
        return yield push.call(this)
      } else if (this.query.type === 'update') {
        return yield create.call(this)
      } else if (this.query.type === 'destroy') {
        return yield destroy.call(this)
      } else {
        this.body = `unknown query type ${this.query.type}`
      }
    }
  }
}

module.exports = taurusModule