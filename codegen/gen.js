var parseLite = require('lite').parseLite

function genSource(dir,javaTpl,iosTpl,nsPrefix){
    var fs = require('fs');
    var gen = new Gen(nsPrefix);
    var classes = [];
    fs.readdir(dir,function(err,names){
        for(var name of names){
            if(name.match(/\.js$/)){
                name = name.slice(0,-3);
                console.log(name)
                var objMap = require(dir+'/'+name)
                for(var n in objMap){
                    var config = objMap[n];
                    if(/^[A-Z]/.test(n)){//common classes
                        var model = gen.createClass(config,n,name)
                    }else if(config.schema){
                        var model = gen.createInterface(config.schema,n,name)
                    }else{
                        continue;
                    }
                    console.log(javaTpl(model))
                    classes.push(model);
                    console.log(n,name)
                }
            }
        }
        console.log(iosTpl({classes:classes,nsPrefix:nsPrefix}))

        console.log('class:',classes.length,classes.map(c=>c.className))
    })
}
function Gen(nsPrefix){
    this.commonMap = {};
    this.urlMap = {};
    this.nsPrefix = nsPrefix;
}
Gen.prototype = {
    createClass:function(config,className,fileName){
        var nsName = genClassName(this.nsPrefix,fileName)
        var model = new ClassModel(config,className,nsName);
        return model;
    },
    createInterface:function(schema,httpMethodName,fileName){
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
        var ns = nsName.replace(/\.[^\.]+$/,'.'+refs[0]);
        if(iosType){
            return genPrefix(genClassName(ns))+refs[1]
        }
        return  genClassName(ns,refs[1]);
    }else if(attr.type == 'array'){
        var itemType = getType(attr.items,nsName,iosType);
        return iosType?`NSArray<${itemType}>`:`java.util.List<${itemType}>`
    }else{
        switch(attr.type){
        case 'int':
        case 'long':
        case 'integer':
            return 'int'
        case 'float':
        case 'double':
        case 'number':
            return iosType?'double double':'double'
        case 'boolean':
            return 'boolean'
        case 'date':
            return iosType?'NSDate':'java.util.Date'
        default :
            return iosType?"NSString":'String'
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
function run(dir,defaultPackage){
    require('fs').readFile(__dirname+'/java.tpl',function(err,data){
        var javaTpl =  parseLite(data.toString());
        require('fs').readFile(__dirname+'/oc.tpl',function(err,data){
            var iosTpl =  parseLite(data.toString());
            genSource(dir,javaTpl,iosTpl,defaultPackage)
        })
    })
}
var dir = process.argv[2]
var defaultPackage = process.argv[3]
require('fs').readdir(dir,function(err,list){
    dir = require('fs').realpathSync(dir);
    //console.log(dir)
    if(err){
        console.error('invalid schema dir:',err)
    }else{
        console.log(`dir:${dir} defaultPackage${defaultPackage}`);
        for(var n of list){
            if(n.match(/\.js$/)){

            }
        }
        run(dir,defaultPackage)
    }
})