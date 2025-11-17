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

app.use(cors({
  origin: "http://localhost:5173", // local frontend
  credentials: true,
}));

app.use(fileupload());
app.use("/api/user", routes);

app.get("/", (req, res) => res.send("Server is running"));

mongoose.connect(process.env.MONGO_URL, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log("Database connected"))
.catch((err) => console.log("Database NOT connected:", err));

module.exports = app;
