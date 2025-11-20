const express = require('express');
const router = express.Router();
const About = require('../models/About');

// GET all about entries (or the latest one if it's a single document)
router.get('/', async (req, res) => {
  try {
    const abouts = await About.find().sort({ createdAt: -1 });
    res.json(abouts);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET about by ID
router.get('/:id', async (req, res) => {
  try {
    const about = await About.findById(req.params.id);
    if (!about) return res.status(404).json({ message: 'About not found' });
    res.json(about);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST create about
router.post('/', async (req, res) => {
  const about = new About(req.body);
  try {
    const newAbout = await about.save();
    res.status(201).json(newAbout);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// PUT update about
router.put('/:id', async (req, res) => {
  try {
    const updatedAbout = await About.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!updatedAbout) return res.status(404).json({ message: 'About not found' });
    res.json(updatedAbout);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// DELETE about
router.delete('/:id', async (req, res) => {
  try {
    const deletedAbout = await About.findByIdAndDelete(req.params.id);
    if (!deletedAbout) return res.status(404).json({ message: 'About not found' });
    res.json({ message: 'About deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;