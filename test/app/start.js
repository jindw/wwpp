/*
var oldPromise = Promise
function wrap(fn){
	return fn && function(){
		try{
			fn.apply(this,arguments);
		}catch(e){
			console.log(e)
			throw e;
		}
	}
}
var proto = Promise.prototype
var oldThen = proto['then'];
var oldCatch = proto['catch'];
proto['catch'] = function(fn){
	return oldCatch.call(this,wrap(fn))
}
proto.then = function(fn,fn2){
	fn = wrap(fn)
	fn2 = wrap(fn2)
	return  oldThen.apply(this,arguments)
}
Promise = function(init){
	var impl= new oldPromise(wrap(init))
	return impl;
}

Promise.reject = oldPromise.reject;
Promise.resolve = oldPromise.resolve;

//*/



var path = require('path');
var schemaDir = path.join(__dirname,'./schema/');
var webroot = path.join(__dirname,'./webroot/');

require('wwpp')(schemaDir,webroot).then(
    function(app){
        app.start()
    })