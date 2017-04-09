const Ajv = require('ajv')
const async = require('asf')
module.exports = bindSchema;

function * validatorInterceptor(req,resp,next,config){//validate
    let validator = config.validator;
    if(validator && validator.request){
        var value = req.value;
        value.then(function(value){
            if(!validator.request(value)){//value changed
                console.error('input validate error:',validator.request.errors.map(ajvErrorMap))
            }
        })
    }
    try{
        var model = this;
        return next(req,resp);
    }finally{
        if(validator && validator.response){
            async(function *(){
                for(var key in model){
                    model[key] = yield model[key];
                }
                if(!validator.response(model)){
                   return validator.response.errors
                }
            })().then(errors=>errors && console.error('output validate error:'+errors.map(ajvErrorMap)))
        }
    }
}
function ajvErrorMap(err){
    return err.dataPath+':\n'+err.message || err;
}

function bindSchema(app,fileConfigMap){
    let ajv = new Ajv();
    let coerceAjv = new Ajv({ coerceTypes: true });
    let schemaMap = {};
    for(var fileName in fileConfigMap){
        let id = fileName.replace(/\.js$/,'')
        let definitions = fileConfigMap[fileName].definitions;
        let schema = {id: id, definitions:definitions};
        ajv.addSchema(schema)
        coerceAjv.addSchema(schema)
        schemaMap[id] = schema;
    }
    for(var fileName in fileConfigMap){
        let fileConfig = fileConfigMap[fileName];
        let path = fileConfig.path;
        let title = fileConfig.title;
        if(path){
            let configMap = {};
            let actionMap = {};
            let methodMap = fileConfig.methods;
            for(var m in methodMap){
                let action = methodMap[m].action;
                let validator = methodMap[m].validator;
                if(action || validator){
                    if(validator){
                        //var validator.request
                        configMap[m] = {
                            validator:{
                                request: validator.request && coerceAjv.compile(validator.request),
                                response: validator.response && ajv.compile(validator.response),
                                ref:closureRefs(schemaMap,validator.request,validator.response)
                            },
                            modelHandler:validator.response && createResponseProxyHander(validator.response,ajv)
                        };
                    }

                    actionMap[m] = action
                }
            }
            configMap.path = path;
            configMap.title = title;
            app.bind(configMap,actionMap)
        }
    }
    app.intercept(validatorInterceptor);
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
                var validate = vm[key];
                if(!(value instanceof Promise ) &&  !validate(value)){
                    try{
                        var schema = JSON.stringify(validate.schema);
                        var json = JSON.stringify(value);
                    }catch(e){json = e;}
                    throw new Error('valid property '+key +'!!\n'+
                        'json data: \n'+ json +'\n\nnot match schema:\n'+schema+'\n\n'+
                        'validate error:\n'+(validate.errors.map(ajvErrorMap))+'\n\n');
                }
            }else{
                throw new Error('property is not defined!'+key);
            }
            return Reflect.set(target, key, value, receiver);
        }
    }
}
function closureRefs(refMap,...vs){
    var map = {};
    var refs = [];
    for(let v of vs){
        if(!v || !v.properties){
            continue;
        }
        let props = v.properties;
        for(var n in props){
            var p =props[n];
            var ref = p.$ref || p.items && p.items.$ref;
            if(ref && refs.indexOf(ref)<0){
                refs.push(ref);
                let [fileName,defKey] = ref.split('#');
                map[ref] = refMap[fileName].definitions[defKey.replace('/definitions/','')];
                vs.push(map[ref])
                //console.log('###########',ref)
            }
        }
    }
    return map;
}