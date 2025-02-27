const mongoose=require('mongoose');
const { type } = require('os');
const {Schema}=mongoose;
const addressSchema=new Schema({
    userId:{type:mongoose.Schema.Types.ObjectId,ref:'User',required:true},
    address:[{
       name:{
        type:String,
        required:true
       },
       phone:{
        type:Number,
        required:true
       },
       pincode:{
        type:Number,
        required:true
       },
       locality:{
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
       country:{
         type:String,
         required:true
       },
       addressType:{
        type:String,
        required:true
       },
       altPhone:{
        type:Number,
        required:false
       },
       
    }]
   });

module.exports=mongoose.model('Address',addressSchema);