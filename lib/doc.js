module.exports = genDoc;

function genDoc(app,binder,path){
    let action = binder.action;
    let config = binder.config;
    let method = {};
    let model = {
        path:path,
        title:config.title,
        method:method,
        util:{
            genid(path,id){
                return (path+'__'+id).replace(/[^\w]/g,'_')
            },
            genTips(schema){
                var buf = []
                for(var n in schema){
                    if(!/^(?:\$ref|type|description|items)\b/.test(n))buf.push(n+':'+JSON.stringify(schema[n]))
                }
                return buf.join('\n')
            }
        }
    };

    //console.log(action)
    //console.log(config)

    for(let n in action){
        method[n] = {impl:action[n]+''}
    }
    for(let n in config){
        if(n!='path' && n!='title'){
            let conf = method[n] = method[n] || {};
            let validator = config[n].validator;
            conf.config = {
                validator:validator && {
                    request:validator.request && validator.request.schema,
                    response:validator.response && validator.response.schema,
                    refs:validator.ref
                }
            };
        }
    }
    return model;
}

