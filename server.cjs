const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const jwt = require("jsonwebtoken");
const path = require("path");
require('dotenv').config();

const app = express();

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.log(err));

// Routes
app.use(require('./routes/auth.cjs'));
app.use(require('./routes/dash.cjs'));
app.use(require('./routes/map.cjs'));
app.use(require('./routes/pickup.cjs'));
app.use(require('./routes/explore.cjs'));
app.use(require('./routes/report.cjs'));
app.use(require('./routes/admin.cjs'));
app.use(require('./routes/company.cjs'));

const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});
