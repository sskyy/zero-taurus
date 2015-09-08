var _ = require('lodash')
var request = require('superagent')
var util = require('./util')
var uuid = require('uuid')
var taurusCollection = require('taurus-mongo/lib/collection')




///////////////////////////
//           query
///////////////////////////

function *query( database, args) {
  //if( !this.request.body.todos ) return this.body = []
  //TODO 多个query
  var results = {}

  for (var queryName in args) {
    results[queryName] = yield taurusCollection.pull(database, args[queryName])
  }

  return results
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



function *push(database, args) {
  return yield taurusCollection.push(database, args.ast, args.rawNodesToSave, args.trackerRelationMap)
}

///////////////////////
//           destroy
///////////////////////
function *destroy(database, args){
  console.log( "destroying===>",this.body )
  return yield taurusCollection.destroy( database, args.type, args.id )
}



////////////////////////////
//               exports
////////////////////////////
//TODO 写到配置里去
var database = 'mongodb://localhost:27017/test'

var taurusModule = {
  routes: {
    'POST /taurus/query': function*() {
      var result
      if (this.query.type === 'query') {
        result = yield query(database, this.request.body)

      } else if (this.query.type === 'push') {
        result = yield push(database, this.request.body)

      } else if (this.query.type === 'update') {
        result = yield create(database, this.request.body)

      } else if (this.query.type === 'destroy') {
        result = yield destroy(database, this.request.body)

      } else {
        this.body = `unknown query type ${this.query.type}`
      }
      console.log('query result', result)
      this.body = result
    }
  },
  query,
  push,
  destroy
}

module.exports = taurusModule