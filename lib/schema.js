const fs = require('fs');
const async = require('asf')
const path = require('path')



module.exports=loadFileConfigMap = async(function *(dir){
    var list = yield readDir(dir);
    let fileConfigMap = {};
    for(var n of list){
        if(n.match(/\.js$/)){
            let resource = require(path.join(dir,n))
            fileConfigMap[n] = parseResource(resource);
        }else if(!n.match(/\./)){
             try{
                 var list2 = yield readDir(path.join(dir,n));
             }catch(e){
                 console.error(e)
                 continue;
             }
             for(var n2 of list2){
                 if(n2.match(/\.js$/)){
                     let resource = require(path.join(dir,n,n2))
                     fileConfigMap[n+'/'+n2] = parseResource(resource);
                 }
             }
        }
    }
    //console.dir(fileConfigMap)
    return fileConfigMap;

})
function readDir(dir){
    return new Promise(function(resolve,reject){
           fs.readdir(dir,function(err,list){
               if(err){
                   reject(new Error('invalid schema dir:'))
               }else{
                   resolve(list);
               }
           });
        })
}
function parseResource(resource){
    let path = resource.path;
    let title = resource.title;
    let methodMap = {};
    let definitions = {};
    for(var n in resource){
        let config = resource[n];
        if(/^[A-Z]/.test(n)){
            definitions[n] = createJSONSchema(config);
        }else if(path ){
            let schema =config.schema && dep1Copy(config.schema);
            let action = config.action;
            if(schema || action){
                for(var type in schema){
                    schema[type] = createJSONSchema(schema[type])
                }
                methodMap[n] = {
                    validator:schema,
                    action:config.action
                }
            }else{

            }
        }
    }
    return {
        path : path,
        title:title,
        definitions: definitions,
        methods: methodMap
    }
}
function dep1Copy(obj,toObject){
    var rtv=toObject || {};
    for(var n in obj){
        rtv[n] = obj[n];
    }
    return rtv;
}
function createJSONSchema(props){
    var newProps = {};
    let required = [];
    for(var n in props){
        var p =  newProps[n] = dep1Copy(props[n]);
        required.push(n);
        if(p.type =='array'){
            p = p.items = dep1Copy(p.items);
        }
        if(p.type =='date'){
            p.type = 'integer';
            Object.defineProperty(p,'class', {value:'date'});
        }
        var ref = p.$ref || p.ref;
        if(ref){
            //common#Product => common#/definitions/Product
            p.$ref = ref.replace(/#\/?/,'#/definitions/');
            delete p.ref;
        }
    }
    return {
        type:'object',
        properties:newProps,
        required:required
    }
}