const mongoose=require('mongoose');
const {Schema}=mongoose;
const reviewSchema=new Schema({
    user:{type:mongoose.Schema.Types.ObjectId,ref:'User',required:'true'},
    book:{type:mongoose.Schema.Types.ObjectId,ref:'Book',required:'true'},
    rating:{type:Number,required:'true',min:1,max:5},
    comment:{type:String},
    createdAt:{type:Date,default:Date.now()},
    updatedAt:{type:Date,default:Date.now()}
});

module.exports=mongoose.model('Review',reviewSchema);