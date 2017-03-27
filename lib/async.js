module.exports = function(fn){
    return fn instanceof GeneratorFunction? function(){
        var result = fn.apply(this,arguments);
        return new Promise(function(resolve,reject){
            function onError(e){
                try{
                    result.throw(e);
                }catch(e){
                    reject(e)
                }
            }
            function onNext(value){
                try{
                    let next = result.next(value);
                    value = next.value;
                    while(!next.done){
                        if(value instanceof Promise){
                            return value.then(onNext,onError);
                        }else{
                            next = result.next(next.value);
                            value = next.value;
                        }
                    }
                    resolve(value);
                }catch(e){
                    reject(e)
                }
            }
            onNext();
        })
    }:fn;
}

const GeneratorFunction = new Function('return (function *(){}).constructor')()