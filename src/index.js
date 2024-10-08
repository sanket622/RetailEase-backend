require('dotenv').config(); 
const express = require('express');
const cors = require("cors");
require('../db/config.js'); 
const User = require("../db/user.js");
const Product = require("../db/Product.js"); 
const jwt = require('jsonwebtoken');
const app = express();

const jwtKey = process.env.JWT_KEY || 'e-comm'; 

app.use(express.json());
app.use(cors());

app.get("/", (req, res) => {
    res.send("Welcome to the Database");
});

app.post("/register", async (req, resp) => {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
        return resp.status(400).send({ result: "Please fill all the fields" });
    }
    const userExists = await User.findOne({ email });
    if (userExists) {
        return resp.status(400).json({ message: "User already exists, need to login." });
    }
    let user = new User(req.body);
    try {
        let result = await user.save();
        result = result.toObject(); 
        delete result.password;
        jwt.sign({ result }, jwtKey, { expiresIn: "2h" }, (err, token) => {
            if (err) {
                return resp.status(500).send({ result: "Something went wrong, please try again later" });
            }
            return resp.send({ result, auth: token });
        });
    } catch (error) {
        console.error(error); 
        return resp.status(500).send({ result: "Server error, please try again" });
    }
});

app.post("/login", async (req, resp) => {
    if (req.body.password && req.body.email) {
        let user = await User.findOne(req.body).select("-password");
        if (user) {
            jwt.sign({ user }, jwtKey, { expiresIn: "2h" }, (err, token) => {
                if (err) {
                    resp.send({ result: "Something went wrong, please try after sometime" });
                }
                resp.send({ user, auth: token });
            });
        } else {
            resp.send({ result: "No user Found" });
        }
    } else {
        resp.send({ result: "No user Found" });
    }
});

app.post("/add-product", verifyToken, async (req, resp) => {
    try {
        let product = new Product(req.body);
        let result = await product.save();
        resp.status(201).send(result); 
    } catch (error) {
        console.error("Error adding product:", error);
        resp.status(500).send({ error: "Failed to add product" });
    }
});

app.get("/products", verifyToken, async (req, resp) => {
    let products = await Product.find();
    if (products.length > 0) {
        resp.send(products);
    } else {
        resp.send({ result: "No products found" });
    }
});

app.delete("/product/:id", verifyToken, async (req, resp) => {
    const result = await Product.deleteOne({ _id: req.params.id });
    resp.send(result);
});

app.get("/product/:id", verifyToken, async (req, resp) => {
    let result = await Product.findOne({ _id: req.params.id });
    if (result) {
        resp.send(result);
    } else {
        resp.send({ result: "No Record found" });
    }
});

app.put("/product/:id", verifyToken, async (req, resp) => {
    try {
        const updatedProduct = await Product.findByIdAndUpdate(
            req.params.id,
            { $set: req.body },
            { new: true }
        );

        if (!updatedProduct) {
            return resp.status(404).send({ message: "Product not found" });
        }

        resp.status(200).send({ message: "Product updated successfully", product: updatedProduct });
    } catch (error) {
        resp.status(500).send({ message: "Error updating product", error });
    }
});

app.get("/search/:key", verifyToken, async (req, resp) => {
    let result = await Product.find({
        "$or": [
            { name: { $regex: req.params.key, $options: "i" } },
            { company: { $regex: req.params.key, $options: "i" } },
            { category: { $regex: req.params.key, $options: "i" } }
        ]
    });
    resp.send(result);
});

function verifyToken(req, resp, next) {
    let token = req.headers['authorization'];
    if (token) {
        token = token.split(' ')[1];
        jwt.verify(token, jwtKey, (err, valid) => {
            if (err) {
                resp.status(401).send({ Result: "Please provide valid token" });
            } else {
                next();
            }
        });
    } else {
        resp.status(403).send({ Result: "Please add token with header" });
    }
}

const PORT = process.env.PORT || 5000; // Default to 5000 if not set
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
