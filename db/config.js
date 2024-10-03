const mongoose = require("mongoose");

const options = {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    poolSize: 10,  // Maintain up to 10 socket connections
    serverSelectionTimeoutMS: 5000,  // Keep trying to send operations for 5 seconds
    socketTimeoutMS: 45000,  // Close sockets after 45 seconds of inactivity
};

// Establish connection
mongoose.connect('mongodb+srv://user121:1234@cluster0.rr2mpun.mongodb.net/RetailEase?retryWrites=true&w=majority&appName=Cluster0', options)
    .then(() => console.log('Connection successful!'))
    .catch(err => console.log('No connection:', err));

const db = mongoose.connection;

// Connection event handlers
db.on("error", console.error.bind(console, "Error connecting to DB"));
db.once("open", function () {
    console.log("Successfully connected to DB");
});
