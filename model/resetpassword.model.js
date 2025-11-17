const mongoose=require("mongoose")

const resetSchema=new mongoose.Schema({

    userId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User",
        required:true
    },
    reset_token:{
        type:String,
        required:true

    },
    createdAt:{
        type:Date,
        default:Date.now(),
        expires:3600

    }

})

module.exports=mongoose.model("Resetpassword",resetSchema)