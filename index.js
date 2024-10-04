const express = require('express');
const cors = require("cors");
require('./db/config');
const User = require("./db/user.js");
const Product = require("./db/Product");
const app = express();
const jwt = require('jsonwebtoken');
const jwtKey = 'e-comm';


app.use(express.json());
app.use(cors());

app.get("/",(req,res)=>{
res.send("Welocme to the Database");
});
app.post("/register", async (req, resp) => {
      const { name, email, password } = req.body;
  
      // Check if all required fields are provided
      if (!name || !email || !password) {
          return resp.status(400).send({ result: "Please fill all the fields" });
      }
  
      // Check if the user already exists based on the email
      const userExists = await User.findOne({ email });
      if (userExists) {
          return resp.status(400).json({ message: "User already exists, need to login." });
      }
  
      // Create a new user if they don't exist
      let user = new User(req.body);
      
      // Save the new user to the database
      try {
          let result = await user.save();
          result = result.toObject(); // Convert to plain object to remove mongoose specific fields
          delete result.password; // Remove the password before sending the response
          
          // Generate a JWT token
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
  
  


app.post("/login",async (req,resp) => {
      if(req.body.password && req.body.email){
            let user = await User.findOne(req.body).select("-password");
            if(user)
            {
                  jwt.sign({user},jwtKey,{expiresIn:"2h"},(err,token)=>{
                        if(err){
                              resp.send({result:"something went wrong , please try after sometimr"});
                        }
                        resp.send({user,auth:token})
                  })
            }else{
                  resp.send({result:"No user Found"});
            } 
      }else{
            resp.send({result:"No user Found"});
      }
   
})

app.post("/add-product", verifyToken, async (req, resp) => {
      try {
        let product = new Product(req.body);
        let result = await product.save();
        resp.status(201).send(result); // Use proper status codes
      } catch (error) {
        console.error("Error adding product:", error);
        resp.status(500).send({ error: "Failed to add product" });
      }
    });
    

app.get("/products",verifyToken, async(req,resp) => {
      let products = await Product.find();
      if(products.length>0){
            resp.send(products);
      }else{
            resp.send({result:"No products found"});
      }
})

app.delete("/product/:id",verifyToken,async (req,resp)=>{
      const result = await Product.deleteOne({_id:req.params.id});
      resp.send(result);
})

app.get("/product/:id",verifyToken,async (req,resp)=>{
     let result = await Product.findOne({_id:req.params.id});
     if(result){
      resp.send(result)
     }else{
      resp.send({result:"No Record found"})
     }
    
})

app.put("/product/:id", verifyToken, async (req, resp) => {
      try {
          const updatedProduct = await Product.findByIdAndUpdate(
              req.params.id,
              {
                  $set: req.body, // Updating the fields with the data from req.body
              },
              { new: true } // This option returns the updated document
          );
  
          if (!updatedProduct) {
              return resp.status(404).send({ message: "Product not found" });
          }
  
          resp.status(200).send({ message: "Product updated successfully", product: updatedProduct });
      } catch (error) {
          resp.status(500).send({ message: "Error updating product", error });
      }
  });
  

app.get("/search/:key",verifyToken,async(req,resp)=>{
      let result = await Product.find({
            "$or":[
                  {name:{$regex:req.params.key}},
                  {company:{$regex:req.params.key}},
                  {category:{$regex:req.params.key}}
            ]
      });
      resp.send(result);  
})

function verifyToken(req,resp,next){
      let token = req.headers['authorization']
      if(token){
          token = token.split(' ')[1];
          jwt.verify(token,jwtKey,(err,valid)=>{
            if(err){
                  resp.status(401).send({Result:"Please provide valid token"})
            }else{
            next();    
            }
          })
      }else{
      resp.status(403).send({Result:"Please add token with header"})
      }
}

app.listen(5000);