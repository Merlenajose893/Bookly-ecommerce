const mongoose=require('mongoose');

const {Schema}=mongoose;
const userSchema=new Schema({
    name:{type:String,required:true},
    email:{type:String,required:true,unique:true},
    password:{type:String,required:true,unique:true},
    googleId:{type:String,required:true,unique:true},
    password:{type:String,required:false},
    isBlocked:{type:Boolean,default:false},
    isAdmin:{type:Boolean,default:false }
});

module.exports=userSchema;