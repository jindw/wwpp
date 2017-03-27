const parseLite = require('lite').parseLite
const fs = require('fs')
const path = require('path')
const child_process = require("child_process");


module.exports = run;

async function run(schemaDir,outputDir,nsPrefix){
    if(!schemaDir || !outputDir){
        return;
    }
    try{
        schemaDir = fs.realpathSync(schemaDir);
        outputDir = fs.realpathSync(outputDir);
        console.log(`schemaDir:${schemaDir}; outputDir: ${outputDir}; nsPrefix{nsPrefix}`);
        if(!schemaDir || !outputDir){
            return;
        }
        //var tpl = await readFile(__dirname+'/java.tpl');
        //console.log(tpl)
        var javaTpl =  parseLite(await readFile(__dirname+'/java.tpl')+'');
        var iosTpl =  parseLite(await readFile(__dirname+'/oc.tpl')+'');
        //genSource(schemaDir,outputDir,javaTpl,iosTpl,defaultPackage)
        var gen = new Gen(schemaDir,nsPrefix);
        var classes = await gen.genModel();


        var javaScource = []
        for(var cls of classes){
            var file = await mkdirs(outputDir,cls.nsName)+'/'+cls.className+'.java';
            javaScource.push(file)
            await writeFile(file,javaTpl(cls))
        }
        var cmd = 'javac -d '+outputDir + ' '+javaScource.join(' ');

        child_process.exec(cmd,function(err){
            console.log('javac complete:',arguments)
            //jar cvf classes.jar Foo.class Bar.class
            cmd = "jar cvf "+outputDir+'/model.jar '+javaScource.join(' ').replace(/([\w\.\$\/]+)\.java/g,'$& $1.class')
            child_process.exec(cmd,function(err){
                console.log('jar complete:',arguments)
            })
        })
        var iosSource = iosTpl({classes:classes,nsPrefix:nsPrefix});
        writeFile(outputDir+'/model.m',iosSource)
    }catch(e){
        console.log(e)
    }
    //console.log(classes)
}


class Gen{
    constructor(schemaDir,nsPrefix){
        this.commonMap = {};
        this.urlMap = {};
        this.nsPrefix = nsPrefix;
        this.schemaDir = schemaDir;
    }
    async genModel(){
        //function genSource(schemaDir,outputDir,javaTpl,iosTpl,nsPrefix){
        var gen =this;
        var classes = [];
        return new Promise(function(resolve,reject){
            fs.readdir(gen.schemaDir,function(err,names){
                for(var name of names){
                    if(name.match(/\.js$/)){
                        name = name.slice(0,-3);
                        //console.log(name)
                        var objMap = require(gen.schemaDir+'/'+name)
                        for(var n in objMap){
                            var config = objMap[n];
                            if(/^[A-Z]/.test(n)){//common classes
                                var model = gen.createClass(config,n,name)
                            }else if(config.schema){
                                var model = gen.createInterface(config.schema,n,name)
                            }else{
                                continue;
                            }
                            //console.log(javaTpl(model))
                            classes.push(model);
                            //console.log(n,name)
                        }
                    }
                }
                resolve(classes)
                //console.log(iosTpl({classes:classes,nsPrefix:nsPrefix}))
                //console.log('class:',classes.length,classes.map(c=>c.className))
            })
        })
    }
    createClass(config,className,fileName){
        var nsName = genClassName(this.nsPrefix,fileName)
        var model = new ClassModel(config,className,nsName);
        return model;
    }
    createInterface(schema,httpMethodName,fileName){
        var className = formatName(fileName)+formatName(httpMethodName)
        var model = this.createClass(schema.response,className);
        if(schema.request){
            model.innerClasses = [
                this.createClass(schema.request,"Request")
            ];
        }
        //console.log(this.tpl(model))
        return model;
    }
}

function genClassName(prefix,postfix){
    return prefix && postfix? prefix+'.'+postfix:prefix||postfix;
}
function genPrefix(name){
    return name.replace(/(^[\w]|[^\w]\w)\w+/g,function(a,g1){
            return g1.slice(-1).toUpperCase();
        })
}
function formatName(name){
    return name.replace(/[^\w]\w|^[a-z]/g,function(a){
        return a.slice(-1).toUpperCase(a);
    })
}
function getType(attr,nsName,iosType){
    if(!attr.type || attr.type == 'object'){
        var ref = attr.ref || attr.$ref||'?#?';
        var refs = ref.split('#');
        var ns = nsName.replace(/.*\./,'') == refs[0]? nsName : nsName + '.'+refs[0];
        //console.log(nsName,ns,refs)
        if(iosType){
            var type =  genPrefix(genClassName(ns))+refs[1];
            return type+'*';
        }
        return  genClassName(ns,refs[1]);
    }else if(attr.type == 'array'){
        var itemType = getType(attr.items,nsName,iosType);
        //if(iosType) console.log('array',itemType)
        return iosType?`NSArray<${itemType}>*`:`java.util.List<${itemType}>`
    }else{
        switch(attr.type){
        case 'int':
        case 'long':
        case 'integer':
            return iosType?'NSInteger':long;
        case 'float':
        case 'double':
        case 'number':
            return iosType?'double':'double'
        case 'boolean':
            return 'boolean'
        case 'date':
            return iosType?'NSDate*':'java.util.Date'
        default :
            return iosType?"NSString*":'String'
        }
        return ;
    }
}
function ClassModel(config,className,nsName){
    this.className = className;
    this.prefix = genPrefix(nsName)
    this.nsName = nsName;
    this.imports = [];
    this.attributes = [];
    for(var n in config){
        var attr = Object.create(config[n]);
        attr.name = n;
        attr.iosType = getType(attr,nsName,1);
        attr.type = getType(attr,nsName);
        this.attributes.push(attr);
    }
}
function readFile(file){
    return new Promise(function(resolve,reject){
        try{
            fs.readFile(file,function(err,data){
                if(err){reject(err)}else{resolve(data)};
            });
        }catch(e){
            reject(e)
        }
    })
}
function readDir(file){
    return new Promise(function(resolve,reject){
        fs.readdir(file,function(err,data){
               if(err){reject(err)}else{resolve(data)};
        });
    })
}

function writeFile(file,source){
    return new Promise(function(resolve,reject){
        fs.writeFile(file,source,function(err){
            //console.log('write success:',file,err);
            if(err){reject(err)}else{resolve(file)};
        })
    })
}
async function mkdirs(output,ns){
    var file = output;
    for(var n of ns.split('.')){
        file = path.join(file,n);
        if(!fs.existsSync(file)){
            await new Promise(function(resolve,reject){
                fs.mkdir(file,function(err,status){
                    if(err){
                        reject(err)
                    }else{
                        resolve(status)
                    }
                })
            })

        }
    }
    return file;
}
