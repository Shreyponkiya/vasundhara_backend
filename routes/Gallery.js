const express = require('express');
const router = express.Router();
const Gallery = require('../models/Gallery');

// GET all galleries
router.get('/', async (req, res) => {
  try {
    const galleries = await Gallery.find().sort({ createdAt: -1 });
    res.json(galleries);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET gallery by ID
router.get('/:id', async (req, res) => {
  try {
    const gallery = await Gallery.findById(req.params.id);
    if (!gallery) return res.status(404).json({ message: 'Gallery not found' });
    res.json(gallery);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST create gallery
router.post('/', async (req, res) => {
  const gallery = new Gallery(req.body);
  try {
    const newGallery = await gallery.save();
    res.status(201).json(newGallery);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// PUT update gallery
router.put('/:id', async (req, res) => {
  try {
    const updatedGallery = await Gallery.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!updatedGallery) return res.status(404).json({ message: 'Gallery not found' });
    res.json(updatedGallery);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// DELETE gallery
router.delete('/:id', async (req, res) => {
  try {
    const deletedGallery = await Gallery.findByIdAndDelete(req.params.id);
    if (!deletedGallery) return res.status(404).json({ message: 'Gallery not found' });
    res.json({ message: 'Gallery deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;    