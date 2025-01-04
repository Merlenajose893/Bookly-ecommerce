const mongoose=require('mongoose');
const {Schema}=mongoose;
const addressSchema=new Schema({
    userId:{type:mongoose.Schema.Types.ObjectId,ref:'User',required:true},
    address_line1:{
        type:String,required:true
    },
    address_line2:{
        type:String,required:true
    },
    city:{
        type:String,required:true
    },
    state:{
        type:String,required:true
    },
    country:{
        type:String,required:true
    },
    postal_code:{
        type:String,required:true
    },
    phone_number:{
        type:Number,required:true
    },
    isDefault:{
        type:Boolean,required:true
    },
    createdAt:{
        type:Date,required:Date.now()
    },
    updatedAt:{
        type:Date,required:Date.now()
    }
});

module.exports=mongoose.model('Address',addressSchema);