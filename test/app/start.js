var path = require('path')
require('wwpp')('',path.join(__dirname,'./router/'),path.join(__dirname,'./webroot/')).then(function(app){app.start()})
