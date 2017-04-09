const path = require('path');
const App = require('webwork');
const LiteEngine = require('lite');
module.exports = setup;

const loadFileConfigMap = require('./schema')
const bindSchema = require('./validator');
const buildSystemIntercaptor = require('./system')
function setup(schemaDir,templateDir){
    schemaDir = path.resolve(schemaDir);
    const app = new App();
    if(templateDir){
        templateDir =  path.resolve(templateDir)
        let engine = new LiteEngine(templateDir);
        app.resolveView('*.xhtml',function(){
            return engine.render.apply(engine,arguments)
        });
    }
    app.intercept(buildSystemIntercaptor(app))
    function init(){
        return app;
    }
    return loadFileConfigMap(schemaDir).then(fileConfigMap =>bindSchema(app,fileConfigMap)).then(init)
}