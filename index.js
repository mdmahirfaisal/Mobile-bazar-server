const express = require("express");
const { MongoClient } = require("mongodb");
const ObjectId = require("mongodb").ObjectId;

const app = express();
const cors = require("cors");
require("dotenv").config();
const port = process.env.PORT || 5000;

// middle ware Z
app.use(cors());
app.use(express.json());

app.use((req, res, next) => {
  res.setHeader(
    "Content-Security-Policy",
    "default-src 'self'; script-src 'self' https://vercel.live; img-src 'self' data:;"
  );
  next();
});

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.dt2b3.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;
const client = new MongoClient(uri);

async function run() {
  try {
    await client.connect();
    console.log("mobile bazar database connected successfully");
    const database = client.db("mobile_bazar");
    const productsCollection = database.collection("products");
    const ordersCollection = database.collection("orders");
    const reviewCollection = database.collection("review");
    const usersCollection = database.collection("users");

  
    // GET API Load all products
    app.get("/products", async (req, res) => {
      const cursor = productsCollection.find({});
      const products = await cursor.toArray();
      console.log("products: ", products);
      res.send(products);
    });

    // GET single Product API
    app.get("/products/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const result = await productsCollection.findOne(query);
      res.send(result);
    });

    // DELETE Order  with user
    app.delete("/products/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const result = await productsCollection.deleteOne(query);
      res.send(result);
    });

    // POST API  products send to database
    app.post("/products", async (req, res) => {
      const products = req.body;
      const result = await productsCollection.insertOne(products);
      res.send(result);
    });

    // PUT API product update

    app.put("/updateProduct", async (req, res) => {
      const { id, name, img, description, price } = req.body;
      console.log("Edit Product: ", req.body);
      const query = { _id: ObjectId(id) };
      // const options = { upsert: true };
      const updateDoc = {
        $set: name,
        price,
        description,
        img,
      };
      const result = await productsCollection.updateOne(query, updateDoc);
      res.json(result);
    });

  } finally {
    // await client.close();
  }
}
run().catch(console.dir);

app.listen(port, () => {
  console.log(` listening ${port}`);
});

module.exports = (req, res) => {
  app(req, res);
};
