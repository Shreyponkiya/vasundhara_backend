// models/Contact.js
const mongoose = require('mongoose');

const contactSchema = new mongoose.Schema({
  fullname: { type: String, required: true },
  phone: { type: String, required: true },
  address: { type: String, required: true },
  feedback: { type: String, required: false },
  rating: { type: Number, min: 0, max: 5, default: 0 },
  submittedAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Contact', contactSchema);