exports.path = "/products/";
 exports.get = {
     action:function(req,resp){
         this.list = [
             {
                 id:1024,
                 name: "Product X",
                 provider:{
                     //ref:"common#ProductProvider"
                     id: 11,
                     name: "Name of the product provier\n...",
                     displayName: "displayName" ,
                     tel:  "1234" ,
                     email:  "jindw@xxx.com"
                 },
                 price:10.24
             }
         ];
         this.pageCount = 1;
         //throw new Error();
         return '/test.xhtml'
     },
     schema:{
         request:{
             query:{type:'string'},
             pageIndex:{type:'integer'},
             pageSize:{type:'integer'}
         },
         response:{
             list:{
                 type:'array',
                 items:{
                     ref:"common#Product"
                 }
             },
             pageCount:{type:"integer"}
         }
     }

}