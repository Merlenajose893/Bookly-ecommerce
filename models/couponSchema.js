const mongoose=require('mongoose');
const Schema=mongoose.Schema;
const couponSchema=new Schema({
    name:{type:String,
        required:true,
        unique:true
    },
    createdOn:{
        type:Date,
        default:Date.now(),
        required:true
    }, 
    expiredOn:{
        type:Date,
        required:true
    },
    offerPrice:{
        type:Number,
        required:true
    },
    minimumPrice:{
        type:Number,
        required:true
    },
    isList:{
        type:Boolean,
        default:true
    },
    userId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'User'
    }
    

});
module.exports=mongoose.model('Coupon',couponSchema);