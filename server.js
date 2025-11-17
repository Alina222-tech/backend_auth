const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const cors = require("cors");
const fileupload = require("express-fileupload");

dotenv.config();

const app = express();
const routes = require("./routes/userrouter.js");

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(cors());

app.use(fileupload());

app.use("/api/user", routes);

app.get("/",(req,res)=>{
  res.send("server is running.")
})
mongoose.connect(process.env.MONGO_URL)
.then(() => console.log("Database connected"))
.catch(() => console.log("Database NOT connected"));


module.exports = app;
