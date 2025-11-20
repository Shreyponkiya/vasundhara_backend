const express = require('express');
const router = express.Router();
const Order = require('../models/Order'); // Note: Adjust import if using ES6 in model
const sendOrderEmail = require('../sendEmail');
// GET all orders
router.get('/', async (req, res) => {
  try {
    const orders = await Order.find().populate('items.productId').sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET order by ID
router.get('/:id', async (req, res) => {
  try {
    const order = await Order.findById(req.params.id).populate('items.productId');
    if (!order) return res.status(404).json({ message: 'Order not found' });
    res.json(order);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST create order
router.post('/', async (req, res) => {
  const order = new Order(req.body);

  try {
    // 1️⃣ Save to database first (FAST)
    const newOrder = await order.save();

    // 2️⃣ Send fast response to client
    res.status(201).json({
      message: "Order created successfully",
      order: newOrder
    });

    // 3️⃣ Send email in background (does NOT slow API)
    setImmediate(() => {
      sendOrderEmail(newOrder);
    });

  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});
// PUT update order
router.put('/:id', async (req, res) => {
  try {
    const updatedOrder = await Order.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('items.productId');
    if (!updatedOrder) return res.status(404).json({ message: 'Order not found' });
    res.json(updatedOrder);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// DELETE order
router.delete('/:id', async (req, res) => {
  try {
    const deletedOrder = await Order.findByIdAndDelete(req.params.id);
    if (!deletedOrder) return res.status(404).json({ message: 'Order not found' });
    res.json({ message: 'Order deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;