#Introduction

usage
---
```
npm install wwpm
```
#### Hello Word

```
const wwpp = require('wwpp');
wwpp('./schema/','./webroot/').then(app =>app.start())

```

#Definition Spec
---

  a) Shared Common Class(eg: ./schema/common.js)

``` javascript
//common struct difinition(first char is upper case!)
exports.Product = {
    id: { type: "integer" },//define a integer type
    name: {type: "string" },//define a string type
    provider:{//define a ref object type
        $ref:"common#ProductProvider"
    },
    price: {
        type: "number",//define a float type
        minimum: 0,
        exclusiveMinimum: true
    }
}
exports.ProductProvider = {
    id: { type: "integer" },
    name: { type: "string" },
    tel: { type: "string" },
    email: { type: "string" }
}
```
  b) Resource Interface Define 
  
* struct

```
exports.path = "/product/:id"
exports.get = {
	schema:{
		request:{...},//request data json schema definition
		response:{...},//response data json schema definition
	},
	action:function(req,resp){//process action function
		....
	}
}
```
     
* eg:./schema/product.js

``` javascript

//resource interface difinition
//path is required, and any http methods:get ,post,delete....
exports.path = "/product/:id"
exports.get = {
    schema:{
        request:{id:{type:'integer'}},//ignore input define,got from router
        response:{
            value:{
                ref:'common#Product',
            },
            error:{
                type:'integer',
                optional:true
            }
        }
    },
    action:function(req,resp){
        this.value = new Promise(function(resolve,reject){...})
        return '/product.xhtml'
    }
}
exports.post= {
    schema:{
        request:{ref:'common#Product',},
        response:{
            error:{
                type:'integer',
                optional:true
            }
        }
    },
    action:async function(req,resp){
        await saveProduct(req.values)
        //no view returend and model(this) is stringify as json
    }
 }




##Codegen
---
```
npm install wwpm -g
wwgen -s ./schema/ -o ./output -ns com.example
```