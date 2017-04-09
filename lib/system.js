module.exports = buildSystemIntercaptor
const path = require('path');
const genDoc = require('./doc');
const LiteEngine = require('lite');
function buildSystemIntercaptor(app){
    let engine = new LiteEngine(path.join(__dirname,'../webroot'));
    //engine.litecache = path.join(__dirname,'../webroot/.litecached')
    return  function * adminInterceptor(req,resp,next,config){
        let url = req.url;
        var m = url.match(/^\/\$\/(admin|api)\/([^?]*)/);

        if(m){
            //console.log(url,m)
            //do code-gen
            switch(m[1]){
                case 'admin':
                case 'code-gen':
                break;
                case 'api':
                let path = decodeURIComponent(m[2]);
                let binder = matchBinder(app,path)
                let model = binder &&  genDoc(app,binder,path);
                return model?engine.render('/api-doc.xhtml',model,req,resp): print404(app,req,resp);
                default:
            }

            resp.end('unknow system url:'+req.url);
        }else{
            let result =  yield next(req,resp);
            //console.log(url,m,result)
            if(result == 404){// 404 not found
                let binder = matchBinder(app,url)
                print404(app,req,resp);
            }else{
                return result;
            }
        }
    }
}
function matchBinder(app,path){
    let list = app.routes[1];
    let len = list.length;
    let startIndex = 0;
    while(startIndex<len){
        let binder = list[startIndex++];
        if(path == binder.path){
            return binder;
        }
    }
}
function print404(app,req,resp){
    //console.log('new 404!!')
    resp.writeHead(404,{'Content-Type':'text/html;charset=utf-8'})
    let body = `Request Resource Not Found:${req.url}<br>
        Available Routers List:<hr>
        <ul>
        ${app.routes[0].join('\n').replace(/.+/g,(a,i)=>{
            //app.routes[1][i].config.title//
            let title = matchBinder(app,a).config.title;
            return '<li><a href="/$/api/'+encodeURIComponent(a)+'">'+a+'</a>'+(title?' \t('+title+i+')':'')+'</li>'
        })}
        </ul>`;
    resp.end(body);
}