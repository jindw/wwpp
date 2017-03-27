#!/usr/bin/env node
let gen =require('./gen');

var args = process.argv.slice(2);
var params = {};
var key = null;
args.map(function(v){
    if(v.charAt() == '-'){
        key = v.substr(1);
    }else{
        params[key] = v;
    }
})
var schemaDir = params.source||params.s
var outputDir = params.output|| || params.out||params.o
var nsPrefix = params.ns

gen(schemaDir,outputDir,nsPrefix);