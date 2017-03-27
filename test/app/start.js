var path = require('path');
var schemaDir = path.join(__dirname,'./schema/');
var webroot = path.join(__dirname,'./webroot/');

require('wwpp')(schemaDir,webroot).then(function(app){app.start()})