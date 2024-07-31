// IMPORTING PACKAGE
const mongoose = require("mongoose");


// MAKING CONNECTION 
const DB = mongoose.connect('mongodb+srv://user121:1234@cluster0.rr2mpun.mongodb.net/RetailEase?retryWrites=true&w=majority&appName=Cluster0');

// Handle connection status
DB.then(() => {
    console.log('Connection successful!');
}).catch((err) => {
    console.log('No connection:', err);
});


// Setting it to db
const db = mongoose.connection;


// CHECKING CONNECTION
//if error occurs
db.on("error", console.error.bind(console, "Error connecting to DB"));
// when db connects successfully
db.once("open", function(){
    console.log("Successfully connected to DB");
});