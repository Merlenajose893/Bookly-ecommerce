const express=require('express');
const app=express();
const env=require('dotenv').config();
const db=require('/config/db');
db();
env();

app.listen(process.env.PORT,()=>
{
console.log('Server is running');

});

module.exports=app;