const fs = require('fs');
const path = require('path');
const Ajv = require('ajv')
const App = require('webwork');
const LiteEngine = require('lite');
const async = require('asf')
module.exports = setup;


function * adminInterceptor(req,resp,next,config){
    let url = req.url;
    var m = url.match(/^\/\-\/admin\/([^?]*)/);
    if(m){
        //do code-gen
        switch(m[1]){
        case 'code-gen':
        default:

        }

        return next(req,resp)
    }else{
        return next(req,resp)
    }
}
function * validatorInterceptor(req,resp,next,config){//validate
    let validator = config.validator;
    if(validator && validator.request){
        var value = req.value;
        value.then(function(value){
            if(!validator.request(value)){//value changed
                console.error('input validate error:',validator.request.errors)
            }
        })
    }
    try{
        var model = this;
        return next(req,resp);
    }finally{
        if(validator && validator.response){
            yield async(function *(){
                for(var key in model){
                    model[key] = yield model[key];
                }
                if(!validator.response(model)){
                   console.error('output validate error:',validator.response.errors)
                }
            })()
        }
    }
}
function setup(schemaDir,templateDir){
    schemaDir = path.resolve(schemaDir);
    templateDir = templateDir && path.resolve(templateDir)
    function init(app){
        //console.log('app1:',app)
        let engine = new LiteEngine(templateDir);
        app.resolveView('*.xhtml',function(){
            return engine.render.apply(engine,arguments)
        });
        app.intercept(adminInterceptor)
        app.intercept(validatorInterceptor)
        return app;
    }
    return loadFileConfigMap(schemaDir).then(function(fileConfigMap){
        let app = new App();
        let ajv = new Ajv();
        let coerceAjv = new Ajv({ coerceTypes: true });
        for(var fileName in fileConfigMap){
            let id = fileName.replace(/\.js$/,'')
            let definitions = fileConfigMap[fileName].definitions;
            ajv.addSchema({id: id, definitions:definitions})
            coerceAjv.addSchema({id: id, definitions:definitions})
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
                        if(validator){
                            configMap[m] = {
                                validator:{
                                    request: validator.request && coerceAjv.compile(validator.request),
                                    response: validator.request && ajv.compile(validator.response)
                                },
                                modelHandler:validator.response && createResponseProxyHander(validator.response,ajv)
                            };
                        }

                        actionMap[m] = action
                    }
                }
                configMap.path = path;
                app.bind(configMap,actionMap)
            }
        }
        return app
    }).then(init)
}

function createResponseProxyHander(schema,ajv){
    var props = schema.properties;
    var vm = {};
    for(var n in props){
        vm[n] = ajv.compile(props[n]);
    }
    return props && {
        set: function (target, key, value, receiver) {
            if(props.hasOwnProperty(key)){
                if(!(value instanceof Promise ) &&  !vm[key](value)){
                    throw new Error('valid property !'+key+'\n'+vm[key].errors);
                }
            }else{
                throw new Error('property is not defined!'+key);
            }
            return Reflect.set(target, key, value, receiver);
        }
    }
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