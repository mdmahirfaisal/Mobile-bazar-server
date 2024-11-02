const express = require('express')
const helmet = require("helmet");
const { MongoClient } = require("mongodb");
const ObjectId = require("mongodb").ObjectId;

const app = express();
app.use(helmet());
const cors = require("cors");
require("dotenv").config();

const port = process.env.PORT || 5000;
// Configure specific directives (for CSP, etc.)
// app.use(
//   helmet({
//     contentSecurityPolicy: {
//       directives: {
//         defaultSrc: ["'self'"],
//         scriptSrc: ["'self'", "https://vercel.live"],
//         scriptSrcElem: ["'self'", "https://vercel.live"],
//         objectSrc: ["'none'"],
//         connectSrc: ["'self'", "https://vercel.live"],
//       },
//     },
//   })
// );

app.use((req, res, next) => {
  res.setHeader(
    "Content-Security-Policy",
    "default-src 'self'; script-src-elem 'self' https://vercel.live; img-src 'self' data:; object-src 'none'"
  );
  next();
});


// middle ware 
app.use(cors());
app.use(express.json());


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

    // GET API Load all orders
    app.get("/orders", async (req, res) => {
      const cursor = ordersCollection.find({});
      const orders = await cursor.toArray();
      res.send(orders);
    });

    // GET API orders by specific user
    app.get("/ordersData", async (req, res) => {
      const email = req.query.email;
      const query = { email: email };
      const cursor = ordersCollection.find(query);
      const result = await cursor.toArray();
      res.json(result);
    });

    // POST API  orders send to database
    app.post("/orders", async (req, res) => {
      const orders = req.body;
      const result = await ordersCollection.insertOne(orders);
      res.json(result);
    });

    // DELETE Order  with user
    app.delete("/orders/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const result = await ordersCollection.deleteOne(query);
      res.send(result);
    });

    // GET API Load all products
    app.get("/products", async (req, res) => {
      const cursor = productsCollection.find({});
      const products = await cursor.toArray();
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
      res.json(result);
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

    // POST API  review send to database
    app.post("/review", async (req, res) => {
      const review = req.body;
      const result = await reviewCollection.insertOne(review);
      res.send(result);
    });

    // GET API Load all review
    app.get("/review", async (req, res) => {
      const cursor = reviewCollection.find({});
      const review = await cursor.toArray();
      res.send(review);
    });

    // GET API specific user email
    app.get("/users/:email", async (req, res) => {
      const email = req.params.email;
      const query = { email: email };
      const user = await usersCollection.findOne(query);
      let isAdmin = false;
      if (user?.role === "admin") {
        isAdmin = true;
      }
      res.json({ admin: isAdmin });
    });

    // POST API users
    app.post("/users", async (req, res) => {
      const user = req.body;
      const result = await usersCollection.insertOne(user);
      res.json(result);
    });

    // PUT API users
    app.put("/users", async (req, res) => {
      const user = req.body;
      const filter = { email: user.email };
      const options = { upsert: true };
      const updateDoc = { $set: user };
      const result = await usersCollection.updateOne(
        filter,
        updateDoc,
        options
      );
      res.json(result);
    });

    // PUT API users admin
    app.put("/users/admin", async (req, res) => {
      const user = req.body;
      const filter = { email: user.email };
      const updateDoc = { $set: { role: "admin" } };
      const result = await usersCollection.updateOne(filter, updateDoc);
      res.json(result);
    });

    // PUT API status update
    app.put("/updateOrderStatus", (req, res) => {
      const { id, status } = req.body;
      ordersCollection
        .findOneAndUpdate(
          { _id: ObjectId(id) },
          {
            $set: { status },
          }
        )
        .then((result) => res.json(result.lastErrorObject.updatedExisting));
    });
  } finally {
    // await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send('Mobile bazar "API"   Here');
});

app.listen(port, () => {
  console.log(` listening ${port}`);
});

module.exports = app;