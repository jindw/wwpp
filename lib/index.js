const fs = require('fs');
const path = require('path');
const Ajv = require('ajv')
const App = require('webwork');
const LiteEngine = require('lite');
module.exports = setup;



function setup(prefix,routesDir,templateDir,staticDir){
    var app = new App(prefix);
    function init(app){
         let engine = new LiteEngine(templateDir);
         app.resolveView('*.xhtml',function(){
             return engine.render.apply(engine,arguments)
         });
         app.intercept(function * (req,resp,next,config){
             let validator = config.validator;
             if(validator && validator.request && !validator.request(dep1Copy(req.params,req.query))){
                 console.error('input validate error:',validator.request.errors)
             }
             try{
                 var model = this;
                 var result =  yield next(req,resp);
                 return result;
             }finally{
                 if(validator && validator.response && !validator.response(model)){
                     console.error('output validate error:',validator.response.errors)
                 }
             }
         })
         return app;
     }
    return loadFileConfigMap(routesDir).then(function(fileConfigMap){
        let ajv = new Ajv();
        for(var fileName in fileConfigMap){
            let id = fileName.replace(/\.js$/,'')
            let definitions = fileConfigMap[fileName].definitions;
            ajv.addSchema({id: id, definitions:definitions})
        }
        for(var fileName in fileConfigMap){
            let fileConfig = fileConfigMap[fileName];
            let path = fileConfig.path;
            if(path){
                let configMap = {};
                let actionMap = {};
                let configs = fileConfig.configs;
                for(var m in configs){
                    let action = configs[m].action;
                    let validator = configs[m].validator;
                    //console.log(action,validator)
                    if(action || validator){
                        configMap[m] = validator && {
                            validator:{
                                request: validator.request && ajv.compile(validator.request),
                                response: validator.request && ajv.compile(validator.response)
                            }
                        };
                    }
                    actionMap[m] = action
                }
                configMap.path = path;
                app.bind(configMap,actionMap)
            }
        }
        return app
    }).then(init)
}

function loadFileConfigMap(dir){
    return new Promise(function(resolve,reject){
        fs.readdir(dir,function(err,list){
            if(err){
                reject(new Error('invalid schema dir:'))
            }else{
                let fileConfigMap = {};
                for(var n of list){
                    if(n.match(/\.js$/)){
                        let resource = require(path.join(dir,n))
                        fileConfigMap[n] = parseResource(resource);

                    }
                }
                resolve(fileConfigMap);
            }
        })
    })
}


function parseResource(resource){
    let path = resource.path;
    let configMap = {};
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
                configMap[n] = {
                    validator:schema,
                    action:config.action
                }
            }
        }
    }
    return {
        path : path,
        definitions: definitions,
        configs: configMap
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
        if(p.type == 'array'){
            p = p.items = dep1Copy(p.items);
        }
        var ref = p.$ref || p.ref;
        if(ref){
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