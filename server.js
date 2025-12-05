const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const fs = require('fs'); // Ensure this is at the top if not already required
const path = require('path'); // Ensure this is at the top

const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

const app = express();

// Middleware
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use(cors("*"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('MongoDB connected successfully');
  })
  .catch((err) => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
});

// Import and mount routers
app.use('/api/products', require('./routes/Product'));
app.use('/api/galleries', require('./routes/Gallery'));
app.use('/api/auth/login', require('./routes/User'));
app.use('/api/contacts', require('./routes/Contact'));
app.use('/api/orders', require('./routes/Order'));
app.use('/api/reviews', require('./routes/Review'));
app.use('/api/abouts', require('./routes/About'));

// Basic route for server status
app.get('/', (req, res) => {
  res.json({ message: 'Server is running' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!' });
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});