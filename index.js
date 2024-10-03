const express = require('express');
const cors = require("cors");
const jwt = require('jsonwebtoken');
const expressJwt = require('express-jwt');
require('./db/config');
const User = require("./db/user");
const Product = require("./db/Product");

const app = express();
const jwtKey = 'e-comm';

app.use(express.json());
app.use(cors());

app.get("/", (req, res) => {
    res.send("Welcome to the Database");
});

// Verify JWT Token Middleware (move this above the routes)
const verifyToken = expressJwt({
    secret: jwtKey,
    algorithms: ['HS256'],
    getToken: req => req.headers.authorization && req.headers.authorization.split(' ')[1]
});

// Register Route
app.post("/register", async (req, resp) => {
    const { name, email, password } = req.body;

    // Check for required fields
    if (!name || !email || !password) {
        return resp.status(400).send({ result: "Please fill all the fields" });
    }

    // Check if user already exists
    const userExists = await User.findOne({ email });
    if (userExists) {
        return resp.status(400).json({ message: "User already exists, need to login." });
    }

    // Create new user
    let user = new User(req.body);

    try {
        let result = await user.save();
        result = result.toObject();
        delete result.password;  // Remove password before sending the response

        // Generate JWT token
        jwt.sign({ result }, jwtKey, { expiresIn: "2h" }, (err, token) => {
            if (err) {
                return resp.status(500).send({ result: "Something went wrong, please try again later" });
            }
            return resp.send({ result, auth: token });
        });
    } catch (error) {
        return resp.status(500).send({ result: "Server error, please try again" });
    }
});

// Login Route
app.post("/login", async (req, resp) => {
    if (req.body.password && req.body.email) {
        let user = await User.findOne(req.body).select("-password");
        if (user) {
            jwt.sign({ user }, jwtKey, { expiresIn: "2h" }, (err, token) => {
                if (err) {
                    resp.send({ result: "Something went wrong, please try again later." });
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

// Add Product Route
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

// Get Products with Pagination
app.get("/products", verifyToken, async (req, resp) => {
    const page = parseInt(req.query.page) || 1; // Default page 1
    const limit = parseInt(req.query.limit) || 10; // Default limit 10
    const skip = (page - 1) * limit;

    try {
        const products = await Product.find().skip(skip).limit(limit);
        const total = await Product.countDocuments();

        resp.send({
            totalPages: Math.ceil(total / limit),
            currentPage: page,
            products,
        });
    } catch (error) {
        resp.status(500).send({ error: "Failed to fetch products" });
    }
});

// Delete Product by ID
app.delete("/product/:id", verifyToken, async (req, resp) => {
    const result = await Product.deleteOne({ _id: req.params.id });
    resp.send(result);
});

// Get Product by ID
app.get("/product/:id", verifyToken, async (req, resp) => {
    let result = await Product.findOne({ _id: req.params.id });
    if (result) {
        resp.send(result);
    } else {
        resp.send({ result: "No Record found" });
    }
});

// Update Product by ID
app.put("/product/:id", verifyToken, async (req, resp) => {
    let result = await Product.updateOne(
        { _id: req.params.id },
        { $set: req.body }
    );
    resp.send(result);
});

// Search Products by Key
app.get("/search/:key", verifyToken, async (req, resp) => {
    let result = await Product.find({
        "$or": [
            { name: { $regex: req.params.key, $options: "i" } },  // Case-insensitive regex
            { company: { $regex: req.params.key, $options: "i" } },
            { category: { $regex: req.params.key, $options: "i" } }
        ]
    });
    resp.send(result);
});

app.listen(5000, () => {
    console.log("Server is running on port 5000");
});
