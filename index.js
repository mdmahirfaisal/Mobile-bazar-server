const express = require("express");
const { MongoClient, ObjectId } = require("mongodb");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const winston = require("winston");
require("dotenv").config();

const app = express();
const port = process.env.PORT || 5000;

// Configure Winston logger (console-only for Vercel)
const logger = winston.createLogger({
  level: "info",
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [new winston.transports.Console()],
});

// Middleware
app.use(helmet()); // Security headers
app.use(
  cors({
    origin: [
      "https://mobile-bazar.vercel.app",
      "http://localhost:3000",
      "http://localhost:3001",
    ],
  })
);
app.use(express.json());
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per window
    message: "Too many requests from this IP, please try again later.",
  })
);
app.use((req, res, next) => {
  logger.info(`Request: ${req.method} ${req.url}`);
  next();
});

// MongoDB Connection
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.dt2b3.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;
const client = new MongoClient(uri, {
  serverSelectionTimeoutMS: 15000, // 15 seconds
  connectTimeoutMS: 30000, // 30 seconds
  retryWrites: true,
  retryReads: true,
});

let db; // Store MongoDB database instance

async function initializeDatabase() {
  try {
    if (!db) {
      await client.connect();
      db = client.db("mobile_bazar");
      logger.info("MongoDB connected successfully");
    }
    return db;
  } catch (error) {
    logger.error("MongoDB connection error:", error);
    throw error;
  }
}

// Error handling middleware
app.use((err, req, res, next) => {
  logger.error(`Error: ${err.message}`, { stack: err.stack });
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
    app.get("/", (req, res) => {
      res.json({ message: "Mobile Bazar API is running" });
    });

    // GET: Load all orders
    app.get("/orders", async (req, res, next) => {
      try {
        const cursor = ordersCollection.find({});
        const orders = await cursor.toArray();
        res.json(orders);
      } catch (error) {
        next(error);
      }
    });

    // GET: Orders by specific user
    app.get("/ordersData", async (req, res, next) => {
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
    app.post("/orders", async (req, res, next) => {
      try {
        const order = req.body;
        if (!order) throw new Error("Order data is required");
        const result = await ordersCollection.insertOne(order);
        logger.info(`Order created: ${result.insertedId}`);
        res.json(result);
      } catch (error) {
        next(error);
      }
    });

    // DELETE: Order by ID
    app.delete("/orders/:id", async (req, res, next) => {
      try {
        const id = req.params.id;
        const query = { _id: new ObjectId(id) };
        const result = await ordersCollection.deleteOne(query);
        if (result.deletedCount === 0) {
          throw new Error("Order not found");
        }
        logger.info(`Order deleted: ${id}`);
        res.json(result);
      } catch (error) {
        next(error);
      }
    });

    // GET: Load all products
    app.get("/products", async (req, res, next) => {
      try {
        const cursor = productsCollection.find({});
        const products = await cursor.toArray();
        res.json(products);
      } catch (error) {
        next(error);
      }
    });

    // GET: Single product by ID
    app.get("/products/:id", async (req, res, next) => {
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
    app.delete("/products/:id", async (req, res, next) => {
      try {
        const id = req.params.id;
        const query = { _id: new ObjectId(id) };
        const result = await productsCollection.deleteOne(query);
        if (result.deletedCount === 0) {
          throw new Error("Product not found");
        }
        logger.info(`Product deleted: ${id}`);
        res.json(result);
      } catch (error) {
        next(error);
      }
    });

    // POST: Create product
    app.post("/products", async (req, res, next) => {
      try {
        const product = req.body;
        if (!product) throw new Error("Product data is required");
        const result = await productsCollection.insertOne(product);
        logger.info(`Product created: ${result.insertedId}`);
        res.json(result);
      } catch (error) {
        next(error);
      }
    });

    // PUT: Update product
    app.put("/updateProduct", async (req, res, next) => {
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
        logger.info(`Product updated: ${id}`);
        res.json(result);
      } catch (error) {
        next(error);
      }
    });

    // POST: Create review
    app.post("/review", async (req, res, next) => {
      try {
        const review = req.body;
        if (!review) throw new Error("Review data is required");
        const result = await reviewCollection.insertOne(review);
        logger.info(`Review created: ${result.insertedId}`);
        res.json(result);
      } catch (error) {
        next(error);
      }
    });

    // GET: Load all reviews
    app.get("/review", async (req, res, next) => {
      try {
        const cursor = reviewCollection.find({});
        const reviews = await cursor.toArray();
        res.json(reviews);
      } catch (error) {
        next(error);
      }
    });

    // GET: Check if user is admin
    app.get("/users/:email", async (req, res, next) => {
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
    app.post("/users", async (req, res, next) => {
      try {
        const user = req.body;
        if (!user.email) throw new Error("User email is required");
        const result = await usersCollection.insertOne(user);
        logger.info(`User created: ${user.email}`);
        res.json(result);
      } catch (error) {
        next(error);
      }
    });

    // PUT: Upsert user
    app.put("/users", async (req, res, next) => {
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
        logger.info(`User upserted: ${user.email}`);
        res.json(result);
      } catch (error) {
        next(error);
      }
    });

    // PUT: Make user admin
    app.put("/users/admin", async (req, res, next) => {
      try {
        const { email } = req.body;
        if (!email) throw new Error("Email is required");
        const filter = { email };
        const updateDoc = { $set: { role: "admin" } };
        const result = await usersCollection.updateOne(filter, updateDoc);
        if (result.matchedCount === 0) {
          throw new Error("User not found");
        }
        logger.info(`User made admin: ${email}`);
        res.json(result);
      } catch (error) {
        next(error);
      }
    });

    // PUT: Update order status
    app.put("/updateOrderStatus", async (req, res, next) => {
      try {
        const { id, status } = req.body;
        if (!id || !status) throw new Error("ID and status are required");
        const query = { _id: new ObjectId(id) };
        const updateDoc = { $set: { status } };
        const result = await ordersCollection.updateOne(query, updateDoc);
        if (result.matchedCount === 0) {
          throw new Error("Order not found");
        }
        logger.info(`Order status updated: ${id}`);
        res.json({ updated: result.matchedCount > 0 });
      } catch (error) {
        next(error);
      }
    });
  } catch (error) {
    logger.error("Error in run():", error);
    throw error;
  }
}

// Start server for local development
if (process.env.NODE_ENV !== "production") {
  app.listen(port, () => {
    logger.info(`Server listening on port ${port}`);
  });
}

// Export for Vercel serverless
module.exports = app;

// Initialize database and handle cleanup
run().catch((error) => {
  logger.error("Failed to start server:", error);
  process.exit(1);
});
