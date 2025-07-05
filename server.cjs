const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const jwt = require("jsonwebtoken");

const path = require("path");
require('dotenv').config();

// Set up the Express app
const app = express();
app.use(cors());
app.use(express.json());
app.use(express.json({ limit: '10mb' })); // 🔧 Increase JSON size limit
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

















mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.log(err));

app.use(require('./routes/auth.cjs'));
app.use(require('./routes/dash.cjs'));
app.use(require('./routes/map.cjs')); // Assuming you have a route for reverse geocoding
app.use(require('./routes/pickup.cjs')); // Route for unassigned pickups
app.use(require('./routes/explore.cjs')); // Route for fetching companies with pickup counts
app.use(require('./routes/report.cjs')); // Route for generating reports
app.use(require('./routes/admin.cjs')); // Admin routes


app.cors = cors({
  origin: '*', // Allow all origins
  methods: ['GET', 'POST', 'PUT', 'DELETE'], // Allow specific methods
  allowedHeaders: ['Content-Type', 'Authorization'] // Allow specific headers
});

app.listen(process.env.PORT, () => {
  console.log(`Server running on port ${process.env.PORT}`);
});
