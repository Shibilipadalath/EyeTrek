    const mongoose=require('mongoose')

    const cartSchema=new mongoose.Schema({
        userId:{
            type:String,
            required:true
        },
        cartItems:[{
            productId:{
                type:mongoose.Schema.Types.ObjectId,
                required:true
            },
            quantity:{
                type:Number,
                default:1
            },
            price:{
                type:Number,
                required:true
            }
        }],
        addedAt:{
            type:Date,
            default:Date.now
        }
    },{timestamps:true})

    module.exports=mongoose.model('Cart',cartSchema)