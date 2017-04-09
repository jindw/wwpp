exports.User = {
    id: { type: "integer" },
    name: { type: "string" },
    displayName: {
        type: "string",
        description:"display on front-end and can be modified any times"
    },
    age:{
        type: "integer",
        minimum: 0
    },
    email: {
        type: "string",
        format:'email'
        //pattern:'^\w+$'
        //min:
        //optional:true
    }
}
exports.Product = {
    id: { type: "integer" },
    name: {
        type: "string",
        description: "Name of the product\n..."
    },
    provider:{
        $ref:"common#ProductProvider"
    },
    listingTime:{
        type:"date"
    },
    price: {
        type: "number",
        minimum: 0,
        exclusiveMinimum: true
    }
}
exports.ProductProvider = {
    id: { type: "integer" },
    name: { type: "string" },
    displayName: { type: "string" },
    tel: { type: "string" },
    email: { type: "string" }
}