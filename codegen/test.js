function gen1(){
    return new Promise(function(resolve,reject){
        setTimeout(function(){
            reject(new Error('e'))
        },100)
    }).then(function(){
            return gen1();
        },function(e){
            console.log('error1',e);
            return 'errored!'
        })
}

new Promise(function(resolve,reject){
        setTimeout(function(){
            resolve(gen1())
        },100)
    }).then(function(r){
        console.log('success',r)
    },function(e){
        console.log('error22:',e)
    })