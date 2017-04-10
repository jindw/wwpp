exports.path = "/product/:id"
exports.title = "Test Title"
exports.Test = {
id:{type:'integer'}
}
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
            listingTime:123,
            name:  "Name of the product\n...",
            provider:{
                //ref:"common#ProductProvider"
                id:1232222,
                name: "Name of the product provier\n...",
                displayName: "displayName" ,
                tel:  "1234" ,
                listingTime:123,
                email:  "jindw@xxx.com"
            },
            price: 1.25
        }
        //return '/test.xhtml'
    }
}
exports.post= {
    schema:{
        request:{
            value:{
                ref:'common#Product',
            }
        },
        response:{
            id2:{type:'integer'}
        }
    },
    action:function(req,resp){
        //TODO:..
    }
 }