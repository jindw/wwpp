#wwpp codegen

usage
---
```
npm install wwpm-codegen -g
wwgen -s ./schema/ -o ./output -ns com.tianpeng
```


definition spec
---

  a) ./schema/common.js
  
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
  b) ./schema/product.js

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
``` 