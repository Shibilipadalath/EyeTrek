const mongoose=require('mongoose')

const adressSchema=new mongoose.Schema({
    userId:{
        type:mongoose.Schema.Types.ObjectId,
        required:true,
        ref:'User'
    },

    address:[{
        name:{
            type:String,
            default:true
        },
        mobile:{
            type:Number,
            required:true
        },
        houseName:{
            type:String,
            required:true
        },
        street:{
            type:String,
            required:true
        },
        city:{
            type:String,
            required:true
        },
        state:{
            type:String,
            required:true
        },
        pinCode:{
            type:Number,
            required:true
        }
    }]
},{
    timestamps:true
})

module.exports=mongoose.model('Address',adressSchema)