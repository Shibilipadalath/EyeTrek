require('dotenv').config();
const express = require("express");
const nocache = require("nocache");
const session = require("express-session");
const path = require("path");
const mongoose = require('mongoose')


const app = express()

const userRoute = require("./routes/userRouter");
const adminRoute = require("./routes/adminRouter");

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(nocache());

app.use((req, res, next) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
  next();
});

app.use(
  session({
    secret: process.env.secretkey || "shibili",
    resave: false,
    saveUninitialized: true,
    cookie: { maxAge: 24 * 60 * 60 * 1000 }

  })
)

app.set("view engine", "ejs");

app.use("/public", express.static(path.join(__dirname, "public")));

const connect = mongoose.connect(process.env.mongoDBConnect)
connect
  .then(() => {
    console.log("MongoDB Connected successfully")
  }).catch((error) => {
    console.error(error, "Error Connecting MongoDB")
  })


app.use('/', userRoute);
app.use('/admin', adminRoute);

app.listen(process.env.port, () => {
  console.log(`Server running on http://localhost:${process.env.port}`);
});
