const mongoose=require('mongoose'),
const {Schema}=mongoose;
const cartSchema=new Schema({
    userId:{type:mongoose.Schema.Types.ObjectId,ref:'User',required:true},
    bookId:{
        type:mongoose.Schema.Types.ObjectId,ref:'Books',required:true
    },
    quantity:{type:Number,default:1},
    addedAt:{type:Date,required:Date.now()},
    createdAt:{type:Date,required:Date.now()},
    updatedAt:{type:Date,required:Date.now()},
    status:{
        type:String,
        enum:['active','purchased','abandoned'],
        default:true
    }
},
  
{timestamps:true});
module.exports=mongoose.model('Cart',cartSchema);