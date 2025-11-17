const express=require("express")
const mongoose=require("mongoose")
const dotenv=require("dotenv")
const cors=require("cors")
const fileupload=require("express-fileupload")
const app=express()
dotenv.config()
const routes=require("./routes/userrouter.js")


app.use(express.json())
app.use(express.urlencoded({extended:true}))
app.use(cors({
  credentials: true,
  origin:"http://localhost:5173",
}));

app.use(fileupload())

app.use("/api/user",routes)
const PORT=process.env.PORT || 1000
mongoose.connect(process.env.MONGO_URL)
.then(()=>{
    app.listen(PORT,()=>{
    console.log(`Server is running on port ${PORT}`)
    console.log("Database is connected.")
})

})
.catch(()=>{
    console.log("database is not connected.")
})