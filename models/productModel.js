const mongoose=require('mongoose')

const productSchema=new mongoose.Schema({
    name:{
        type:String,
        required:true
    },
    description:{
        type:String,
        required:true
    },
    brand:{
        type:String,
        required:true
    },
    stock:{
        type:Number,
        required:true
    },
    originalPrice:{
        type:Number,
        required:true
    },
    offerPrice:{
        type:Number,
        required:true
    },
    category: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'Category'
    },
    image:{
        type:Array,
        required:true
    },
    isActive:{
        type:Boolean,
        required:true,
        default:true
    }
},{
    timestamps: true
})

module.exports=mongoose.model('Product',productSchema)