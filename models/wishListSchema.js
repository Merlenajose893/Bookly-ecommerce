const mongoose=require('mongoose'),
const {Schema}=mongoose;
const wishListSchema=new Schema({
    userId:{type:mongoose.Schema.Types.ObjectId,ref:'User',required:true},
    bookId:[{
        type:mongoose.Schema.Types.ObjectId,ref:'Books',required:true
    }],
    createdAt:{type:Date,required:Date.now()},
    updatedAt:{type:Date,required:Date.now()},
    addedAt:{type:Date,required:Date.now()}
});
module.exports=mongoose.model('wishlist',wishListSchema);
