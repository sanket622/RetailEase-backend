const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
    name: { type: String, index: true },  // Index added
    price: String,
    category: { type: String, index: true },  // Index added
    userId: String,
    company: { type: String, index: true },  // Index added
});

module.exports = mongoose.model("products", productSchema);
