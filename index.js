'use strict'
var _ = require('lodash')
var request = require('superagent')
var util = require('./util')
var uuid = require('uuid')
//var taurusCollection = require('taurus-mongo/lib/collection')
var Taurus = require('taurus-mysql')


function partial(generatorFn) {
  var args = Array.prototype.slice.call(arguments, 1)
  return function *() {
    var runtimeArgs = Array.prototype.slice.call(arguments, 0)
    return yield generatorFn.apply(this, args.concat(runtimeArgs))
  }
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



///////////////////////
//           destroy
///////////////////////


////////////////////////////
//               exports
////////////////////////////
//TODO 写到配置里去

var taurusModule = {
  collections: {},
  extend: function *(module) {
    if( !module.entries || !module.entries.spec ) return

    var types = {}
    for (let entryName in module.entries.spec) {
      if (module.entries.spec[entryName]) {

        _.extend(types, _.cloneDeep(_.indexBy(module.entries.spec[entryName].types, function (t) {
          return t.type
        })))

      }
    }


    console.log('initializing taurus collection', module.name, module.connection, _.values(types))

    if( module.connection ){
      this.collections[module.name] = new Taurus(module.connection, _.values(types))
      yield this.collections[module.name].bootstrap()
      this.addRoute(module.name)
    }else{
      //TODO 增加 load types的版本
    }

  },
  addRoute: function (name) {
    this.routes[`POST /taurus/${name}/query`] = partial(this.routeHandler, name)
  },
  getCollection : function(name){
    return taurusModule.collections[name]
  },
  routes : {},
  routeHandler: function *(collectionName) {
    var result
    var args = this.request.body

    if (this.query.type === 'query') {
      result = {}
      for (let queryName in args) {
        result[queryName] = yield taurusModule.collections[collectionName].pull(args[queryName])
      }

    } else if (this.query.type === 'push') {
      result = yield taurusModule.collections[collectionName].push(args.ast, args.rawNodesToSave, args.trackerRelationMap)


    } else if (this.query.type === 'destroy') {
      result = yield taurusModule.collections[collectionName].destroy(args.type, args.id)

    } else {
      this.body = `unknown query type ${this.query.type}`
    }

    this.body = result
  },
}

module.exports = taurusModule