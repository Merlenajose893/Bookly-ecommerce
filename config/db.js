const mongoose=require('mongoose');
const env=require('dotenv').config();
const connectDB=async()=>{
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Mongodb is connected');
        
    } catch (error) {
        console.log('DB connected is error',error.message);
        process.exit(1);
        
    }
}
module.exports=connectDB();
