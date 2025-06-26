const express = require("express");
const { MongoClient, ObjectId } = require("mongodb");
const cors = require("cors");
require("dotenv").config();

const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB Connection
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.dt2b3.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;
const client = new MongoClient(uri, {
  serverSelectionTimeoutMS: 5000,
  connectTimeoutMS: 10000,
});

let db; // Store MongoDB database instance

// Initialize MongoDB connection
async function initializeDatabase() {
  try {
    if (!db) {
      await client.connect();
      db = client.db("mobile_bazar");
      console.log("MongoDB connected successfully");
    }
    return db;
  } catch (error) {
    console.error("MongoDB connection error:", error);
    throw new Error("Failed to connect to database");
  }
}

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: "Something went wrong!" });
});

// API Routes
async function run() {
  try {
    const database = await initializeDatabase();
    const productsCollection = database.collection("products");
    const ordersCollection = database.collection("orders");
    const reviewCollection = database.collection("review");
    const usersCollection = database.collection("users");

    // Health Check
    app.get("/api/", (req, res) => {
      res.json({ message: "Mobile Bazar API is running" });
    });

    // GET: Load all orders
    app.get("/api/orders", async (req, res, next) => {
      try {
        const cursor = ordersCollection.find({});
        const orders = await cursor.toArray();
        res.json(orders);
      } catch (error) {
        next(error);
      }
    });

    // GET: Orders by specific user
    app.get("/api/ordersData", async (req, res, next) => {
      try {
        const email = req.query.email;
        if (!email) throw new Error("Email is required");
        const query = { email };
        const cursor = ordersCollection.find(query);
        const result = await cursor.toArray();
        res.json(result);
      } catch (error) {
        next(error);
      }
    });

    // POST: Create order
    app.post("/api/orders", async (req, res, next) => {
      try {
        const order = req.body;
        if (!order) throw new Error("Order data is required");
        const result = await ordersCollection.insertOne(order);
        res.json(result);
      } catch (error) {
        next(error);
      }
    });

    // DELETE: Order by ID
    app.delete("/api/orders/:id", async (req, res, next) => {
      try {
        const id = req.params.id;
        const query = { _id: new ObjectId(id) };
        const result = await ordersCollection.deleteOne(query);
        if (result.deletedCount === 0) {
          throw new Error("Order not found");
        }
        res.json(result);
      } catch (error) {
        next(error);
      }
    });

    // GET: Load all products
    app.get("/api/products", async (req, res, next) => {
      try {
        const cursor = productsCollection.find({});
        const products = await cursor.toArray();
        res.json(products);
      } catch (error) {
        next(error);
      }
    });

    // GET: Single product by ID
    app.get("/api/products/:id", async (req, res, next) => {
      try {
        const id = req.params.id;
        const query = { _id: new ObjectId(id) };
        const result = await productsCollection.findOne(query);
        if (!result) throw new Error("Product not found");
        res.json(result);
      } catch (error) {
        next(error);
      }
    });

    // DELETE: Product by ID
    app.delete("/api/products/:id", async (req, res, next) => {
      try {
        const id = req.params.id;
        const query = { _id: new ObjectId(id) };
        const result = await productsCollection.deleteOne(query);
        if (result.deletedCount === 0) {
          throw new Error("Product not found");
        }
        res.json(result);
      } catch (error) {
        next(error);
      }
    });

    // POST: Create product
    app.post("/api/products", async (req, res, next) => {
      try {
        const product = req.body;
        if (!product) throw new Error("Product data is required");
        const result = await productsCollection.insertOne(product);
        res.json(result);
      } catch (error) {
        next(error);
      }
    });

    // PUT: Update product
    app.put("/api/updateProduct", async (req, res, next) => {
      try {
        const { id, name, img, description, price } = req.body;
        if (!id) throw new Error("Product ID is required");
        const query = { _id: new ObjectId(id) };
        const updateDoc = {
          $set: { name, img, description, price },
        };
        const result = await productsCollection.updateOne(query, updateDoc);
        if (result.matchedCount === 0) {
          throw new Error("Product not found");
        }
        res.json(result);
      } catch (error) {
        next(error);
      }
    });

    // POST: Create review
    app.post("/api/review", async (req, res, next) => {
      try {
        const review = req.body;
        if (!review) throw new Error("Review data is required");
        const result = await reviewCollection.insertOne(review);
        res.json(result);
      } catch (error) {
        next(error);
      }
    });

    // GET: Load all reviews
    app.get("/api/review", async (req, res, next) => {
      try {
        const cursor = reviewCollection.find({});
        const reviews = await cursor.toArray();
        res.json(reviews);
      } catch (error) {
        next(error);
      }
    });

    // GET: Check if user is admin
    app.get("/api/users/:email", async (req, res, next) => {
      try {
        const email = req.params.email;
        const query = { email };
        const user = await usersCollection.findOne(query);
        res.json({ admin: user?.role === "admin" });
      } catch (error) {
        next(error);
      }
    });

    // POST: Create user
    app.post("/api/users", async (req, res, next) => {
      try {
        const user = req.body;
        if (!user.email) throw new Error("User email is required");
        const result = await usersCollection.insertOne(user);
        res.json(result);
      } catch (error) {
        next(error);
      }
    });

    // PUT: Upsert user
    app.put("/api/users", async (req, res, next) => {
      try {
        const user = req.body;
        if (!user.email) throw new Error("User email is required");
        const filter = { email: user.email };
        const updateDoc = { $set: user };
        const options = { upsert: true };
        const result = await usersCollection.updateOne(
          filter,
          updateDoc,
          options
        );
        res.json(result);
      } catch (error) {
        next(error);
      }
    });

    // PUT: Make user admin
    app.put("/api/users/admin", async (req, res, next) => {
      try {
        const { email } = req.body;
        if (!email) throw new Error("Email is required");
        const filter = { email };
        const updateDoc = { $set: { role: "admin" } };
        const result = await usersCollection.updateOne(filter, updateDoc);
        if (result.matchedCount === 0) {
          throw new Error("User not found");
        }
        res.json(result);
      } catch (error) {
        next(error);
      }
    });

    // PUT: Update order status
    app.put("/api/updateOrderStatus", async (req, res, next) => {
      try {
        const { id, status } = req.body;
        if (!id || !status) throw new Error("ID and status are required");
        const query = { _id: new ObjectId(id) };
        const updateDoc = { $set: { status } };
        const result = await ordersCollection.updateOne(query, updateDoc);
        if (result.matchedCount === 0) {
          throw new Error("Order not found");
        }
        res.json({ updated: result.matchedCount > 0 });
      } catch (error) {
        next(error);
      }
    });
  } catch (error) {
    console.error("Error in run():", error);
    throw error;
  }
}

// Start server for local development
if (process.env.NODE_ENV !== "production") {
  app.listen(port, () => {
    console.log(`Server listening on port ${port}`);
  });
}

// Export for Vercel serverless
module.exports = app;

// Initialize database and handle cleanup
run().catch((error) => {
  console.error("Failed to start server:", error);
  process.exit(1);
});
