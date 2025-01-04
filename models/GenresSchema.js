const mongoose=require('mongoose');
const {Schema}=mongoose;
const genreSchema=new Schema({
    name:{type:String,required:true,index:true},
    description:{type:String,required:true},
    // productCount:{type:Number,required:true},
    isDeleted:{type:Boolean,default:false},
    isListed:{type:Boolean,default:false},
    createdAt:{type:Date,default:Date.now},
    updatedAt:{type:Date,default:Date.now}
});
genreSchema.index({ name: 1 }, { unique: true });
const Genre= mongoose.model('Genre', genreSchema);
module.exports ={
    Genre
}
  