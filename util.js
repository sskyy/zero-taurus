var cloneDeep = require('lodash.clonedeep')
var assign = require('object-assign')

function noop(){
  return null
}

function hook( obj, fnName, fn ){
  var _fn = obj[fnName] || noop
  obj[fnName] = function(){
    fn.apply(this, arguments)
    return _fn.apply(this, arguments)
  }
  return obj
}

function decorate( obj, fnName, fn){
  var _fn = obj[fnName]
  obj[fnName] = function(){
    return fn.apply( this, [_fn].concat( Array.prototype.slice.call(arguments)))
  }
  return obj
}


function forEach( obj, handler){
  Object.keys(obj).forEach(function(key){
    handler( obj[key],key)
  })
}

function partial( fn, arg ){
  return function(){
    var args = [arg].concat( Array.prototype.slice.call(arguments ))

    return fn.apply(this, args)
  }
}

function defaults( target, defaultsObj ){
  for( var i in defaultsObj ){
    if( defaultsObj.hasOwnProperty(i) && target[i] === undefined){
      target[i] = defaultsObj[i]
    }
  }
  return target
}


var _request = require('superagent')

function request( query, backend ){
  return new Promise( function( resolve, reject){
    _request
      .post(backend)
      .send(query)
      .end(function( err, res){
        if( err ) return reject(err)
        return resolve( res.body )
      })

  })
}


function walkAst(ast, handler, context) {
  if (context === undefined) context = {}

  handler(ast, context)

  forEach(ast.relations,function (relation) {
    var childContext = assign({}, context, {
      relation: {
        name: relation.name,
        reverse: relation.reverse,
        to : relation.to.type
      },
      parent: {
        type: ast.type,
        fields: ast.fields,
        tracker: ast.tracker
      }
    })

    walkAst(relation.to, handler, childContext)
  })
}

function without(source, toRemove){
  var output = []
  source.forEach( function( item ){
    if( toRemove.indexOf(item) === -1){
      output.push( item )
    }
  })
  return output
}

function pick( obj, attrs  ){
  var output = {}
  attrs.forEach(function(attr){
    if( typeof obj[attr] === 'object' ){
      output[attr] =  cloneDeep(obj[attr] )
    }else{
      output[attr] = obj[attr]
    }
  })

  return output
}

function mapValues( obj, handler ){
  var output = {}
  Object.keys( obj ).forEach(function(  key ){
    output[key] = handler( obj[key], key )
  })

  return output
}

function first( obj ){
  return obj[Object.keys(obj).shift()]
}

function map( obj, handler ){
  return Object.keys( obj ).map(function( key){
    return handler(obj[key], key)
  })
}

function zipObject( keys, values ){
  var result = {}
  keys.forEach(function( key, i ){
    if( typeof values=== 'function'){
      result[key] = values(key)
    }else if( typeof values !== 'object' || values.length === undefined){
      result[key] = values
    }else{
      result[key] = values[i]
    }
  })
return result
}



module.exports = {
  hook : hook,
  decorate : decorate,
  forEach : forEach,
  partial : partial,
  defaults : defaults,
  request:request,
  cloneDeep : cloneDeep,
  walkAst : walkAst,
  without : without,
  pick : pick,
  mapValues : mapValues,
  first : first,
  map:map,
  zipObject
}