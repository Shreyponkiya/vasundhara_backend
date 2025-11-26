const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const sendOrderEmail = require('../utils/sendEmail');

// GET all orders
router.get('/', async (req, res) => {
  try {
    const orders = await Order.find()
      .populate('items.productId')
      .sort({ createdAt: -1 });

    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET order by ID
router.get('/:id', async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('items.productId');

    if (!order) return res.status(404).json({ message: 'Order not found' });

    res.json(order);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST create order
router.post('/', async (req, res) => {
  try {
    const order = new Order(req.body);
    const newOrder = await order.save();

    // Fast response
    res.status(201).json({
      message: "Order created successfully",
      order: newOrder
    });

    // Background email
    setImmediate(() => sendOrderEmail(newOrder));

  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// PUT update order
router.put('/:id', async (req, res) => {
  try {
    const order = await Order.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate("items.productId");

    if (!order) return res.status(404).json({ message: 'Order not found' });

    res.json(order);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// DELETE order
router.delete('/:id', async (req, res) => {
  try {
    const order = await Order.findByIdAndDelete(req.params.id);

    if (!order) return res.status(404).json({ message: 'Order not found' });

    res.json({ message: "Order deleted" });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
