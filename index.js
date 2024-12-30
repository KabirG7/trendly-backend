const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const app = express();

// Environment variables
const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI || "mongodb+srv://MoviesUser:passwordMOV@apikeys.dmrv56o.mongodb.net/taskManagerTasks";
const FRONTEND_URL = process.env.FRONTEND_URL || "https://trendly-k.vercel.app";

// Improved CORS configuration for Vercel
app.use(cors({
  origin: [FRONTEND_URL, 'http://localhost:3000'],
  methods: ['GET', 'POST'],
  credentials: true
}));

app.use(express.json());

// MongoDB connection with error handling
mongoose
  .connect(MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("MongoDB connected successfully"))
  .catch((err) => console.error("MongoDB connection error:", err));

// Error handler for MongoDB connection
mongoose.connection.on('error', err => {
  console.error('MongoDB connection error:', err);
});

// MongoDB Schema and Model
const predictionSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  sector: { type: String, required: true },
  changeType: { type: String, required: true },
  outcome: { type: String, required: true },
  prediction: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
});

const Prediction = mongoose.model("Prediction", predictionSchema);

// Health check route
app.get("/", (req, res) => {
  res.json({ message: "Welcome to Trendly API", status: "healthy" });
});

// Save a new prediction with improved error handling
app.post("/api/predictions", async (req, res) => {
  try {
    const { userId, sector, changeType, outcome, prediction, timestamp } = req.body;

    // Validation
    if (!userId || !sector || !changeType || !outcome || !prediction) {
      return res.status(400).json({ 
        error: "All fields are required",
        missing: Object.entries({ userId, sector, changeType, outcome, prediction })
          .filter(([_, value]) => !value)
          .map(([key]) => key)
      });
    }

    const newPrediction = new Prediction({
      userId,
      sector,
      changeType,
      outcome,
      prediction,
      timestamp,
    });

    await newPrediction.save();
    res.status(201).json({ 
      message: "Prediction saved successfully",
      prediction: newPrediction 
    });
  } catch (err) {
    console.error("Error saving prediction:", err);
    res.status(500).json({ 
      error: "Failed to save prediction",
      details: err.message 
    });
  }
});

// Fetch predictions with improved error handling
app.get("/api/predictions/:userId", async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({ error: "User ID is required" });
    }

    const userPredictions = await Prediction.find({ userId })
      .sort({ timestamp: -1 })
      .limit(100); // Add limit for performance

    res.status(200).json({
      count: userPredictions.length,
      predictions: userPredictions
    });
  } catch (err) {
    console.error("Error fetching predictions:", err);
    res.status(500).json({ 
      error: "Failed to fetch predictions",
      details: err.message 
    });
  }
});

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    error: "Something broke!",
    details: err.message
  });
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('Unhandled Rejection:', err);
});