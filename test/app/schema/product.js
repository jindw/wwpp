exports.path = "/product/:id"
exports.get = {
    schema:{
        request:{id:{type:'integer'}},//ignore input define,got from router
        response:{
            value:{
                ref:'common#Product',
            }
        }
    },
    action:function(req,resp){
        console.log('run action!!')
        this.value = {
            id: 123,
            name:  "Name of the product\n...",
            provider:{
                //ref:"common#ProductProvider"
                id: 11,
                name: "Name of the product provier\n...",
                displayName: "displayName" ,
                tel:  "1234" ,
                email:  "jindw@xxx.com"
            },
            price: 1.25
        }
    }
}
exports.post= {
    schema:{
        request:{
            id:{type:'integer'}
        },
        response:{
            value:{
                ref:'common#Product',
            }
        }
    },
    action:function(req,resp){
        //TODO:..
    }
 }