const mongoose=require('mongoose');
const {Schema}=mongoose;
const orderSchema=new Schema({
    user:{type:mongoose.Schema.Types.ObjectId,ref:'User',required:true},
    books:[{
        type:mongoose.Schema.Types.ObjectId,ref:'Books',required:true
    },
{
    quanttity:{type:Number,required:true},
},],
totalAmount:{
    type:Number,required:true
},
status:{type:String,required:true},
price:{type:Number,required:true},
createdAt:{type:Date,required:Date.now()},
updatedAt:{type:Date,required:Date.now()}
});

module.exports=mongoose.model('Orders',orderSchema);