const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const slugify = require('slugify'); // Import at module level for efficiency
const router = express.Router();
const Product = require('../models/Product');

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure Multer for single image upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + Math.round(Math.random() * 1E9) + path.extname(file.originalname));
  }
});
const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'), false);
    }
  }
});

// Helper function to manually generate slug (to mimic pre-save hook)
const generateSlug = (productName) => {
  return slugify(productName + '-' + Date.now(), { lower: true, strict: true });
};

// Helper to get filename from relative image path
const getFilenameFromImagePath = (imagePath) => {
  if (!imagePath || !imagePath.startsWith('/uploads/')) {
    return null;
  }
  return imagePath.substring(9); // Remove '/uploads/' prefix
};

// Helper to get full path from relative image path
const getFullImagePath = (imagePath) => {
  const filename = getFilenameFromImagePath(imagePath);
  return filename ? path.join(uploadsDir, filename) : null;
};

// GET all products
router.get('/', async (req, res) => {
  try {
    const products = await Product.find().sort({ createdAt: -1 });
    // Optionally, enrich each product with calculated discount percentage
    const enrichedProducts = products.map(product => ({
      ...product.toObject(),
      discountPercentage: product.mrp > 0 ? Math.round(((product.mrp - product.sellingPrice) / product.mrp) * 100) : 0
    }));
    res.json(enrichedProducts);
  } catch (err) {
    console.error('Error fetching products:', err);
    res.status(500).json({ message: 'Server error while fetching products' });
  }
});

// GET product by ID
router.get('/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    // Optionally, add calculated discount percentage
    const enrichedProduct = {
      ...product.toObject(),
      discountPercentage: product.mrp > 0 ? Math.round(((product.mrp - product.sellingPrice) / product.mrp) * 100) : 0
    };
    res.json(enrichedProduct);
  } catch (err) {
    console.error('Error fetching product:', err);
    res.status(500).json({ message: 'Server error while fetching product' });
  }
});

// POST create product
router.post('/', upload.single('image'), async (req, res) => {
  try {
    // Basic validation for required fields
    if (!req.body.productName || !req.body.unit || !req.body.quantity || !req.body.mrp || !req.body.sellingPrice) {
      return res.status(400).json({ message: 'Product name, unit (kg or liter), quantity, MRP, and selling price are required' });
    }

    // Validate unit
    if (!['kg', 'liter'].includes(req.body.unit)) {
      return res.status(400).json({ message: 'Unit must be "kg" or "liter"' });
    }

    // Validate quantity is not empty
    if (!req.body.quantity || req.body.quantity.trim() === '') {
      return res.status(400).json({ message: 'Quantity is required' });
    }

    // Parse and validate prices
    const mrp = parseFloat(req.body.mrp);
    const sellingPrice = parseFloat(req.body.sellingPrice);
    if (isNaN(mrp) || mrp <= 0) {
      return res.status(400).json({ message: 'MRP must be a valid positive number' });
    }
    if (isNaN(sellingPrice) || sellingPrice <= 0) {
      return res.status(400).json({ message: 'Selling price must be a valid positive number' });
    }
    if (sellingPrice > mrp) {
      return res.status(400).json({ message: 'Selling price cannot exceed MRP' });
    }

    // Prepare relative image path
    const imagePath = req.file ? `/uploads/${req.file.filename}` : '';

    const productData = {
      productName: req.body.productName.trim(),
      unit: req.body.unit,
      quantity: req.body.quantity.trim(),
      description: req.body.description?.trim() || '',
      mrp,
      sellingPrice,
      image: imagePath,
      slug: req.body.slug || generateSlug(req.body.productName) // Fallback to manual slug
    };

    const product = new Product(productData);
    const newProduct = await product.save();
    // Add calculated discount percentage
    const enrichedProduct = {
      ...newProduct.toObject(),
      discountPercentage: Math.round(((mrp - sellingPrice) / mrp) * 100)
    };
    res.status(201).json(enrichedProduct);
  } catch (err) {
    console.error('Error creating product:', err);
    // Clean up uploaded file if creation fails (using absolute path)
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlink(req.file.path, (unlinkErr) => {
        if (unlinkErr) {
          console.error('Error cleaning up failed upload:', unlinkErr);
        }
      });
    }
    res.status(400).json({ message: err.message || 'Invalid data provided for product creation' });
  }
});

// PUT update product
router.put('/:id', upload.single('image'), async (req, res) => {
  try {
    const existingProduct = await Product.findById(req.params.id);
    if (!existingProduct) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Prepare update data with fallbacks
    const updateData = {
      productName: req.body.productName !== undefined ? req.body.productName.trim() : existingProduct.productName,
      unit: req.body.unit !== undefined ? req.body.unit : existingProduct.unit,
      quantity: req.body.quantity !== undefined ? req.body.quantity.trim() : existingProduct.quantity,
      description: req.body.description !== undefined ? req.body.description.trim() : existingProduct.description,
      mrp: req.body.mrp !== undefined ? parseFloat(req.body.mrp) : existingProduct.mrp,
      sellingPrice: req.body.sellingPrice !== undefined ? parseFloat(req.body.sellingPrice) : existingProduct.sellingPrice
    };

    // Validate unit if provided
    if (req.body.unit !== undefined && !['kg', 'liter'].includes(req.body.unit)) {
      return res.status(400).json({ message: 'Unit must be "kg" or "liter"' });
    }

    // Validate quantity if provided
    if (req.body.quantity !== undefined && (!req.body.quantity || req.body.quantity.trim() === '')) {
      return res.status(400).json({ message: 'Quantity is required' });
    }

    // Validate MRP if provided
    if (req.body.mrp !== undefined && (isNaN(updateData.mrp) || updateData.mrp <= 0)) {
      return res.status(400).json({ message: 'MRP must be a valid positive number' });
    }

    // Validate selling price if provided
    if (req.body.sellingPrice !== undefined && (isNaN(updateData.sellingPrice) || updateData.sellingPrice <= 0)) {
      return res.status(400).json({ message: 'Selling price must be a valid positive number' });
    }

    // Validate sellingPrice <= mrp (using updated values)
    const finalMrp = updateData.mrp !== undefined ? updateData.mrp : existingProduct.mrp;
    const finalSellingPrice = updateData.sellingPrice !== undefined ? updateData.sellingPrice : existingProduct.sellingPrice;
    if (finalSellingPrice > finalMrp) {
      return res.status(400).json({ message: 'Selling price cannot exceed MRP' });
    }

    // Handle image update (store relative path)
    let oldImagePath = existingProduct.image;
    if (req.file) {
      updateData.image = `/uploads/${req.file.filename}`;
      // Delete old image if it exists and is different
      if (oldImagePath && oldImagePath !== updateData.image) {
        const oldFullPath = getFullImagePath(oldImagePath);
        if (oldFullPath && fs.existsSync(oldFullPath)) {
          fs.unlink(oldFullPath, (unlinkErr) => {
            if (unlinkErr) {
              console.error('Error deleting old image:', unlinkErr);
            }
          });
        }
      }
    } else {
      updateData.image = oldImagePath; // Preserve existing image
    }

    // Fetch the document instance to modify in place (triggers hooks on save)
    const productToUpdate = await Product.findById(req.params.id);
    if (!productToUpdate) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Apply updates
    Object.assign(productToUpdate, updateData);

    // Regenerate slug if productName has changed (to trigger pre-save hook)
    if (updateData.productName !== existingProduct.productName) {
      productToUpdate.slug = undefined; // Set to falsy to trigger regeneration in pre-save
    }

    // Save to trigger pre-save hook
    const updatedProduct = await productToUpdate.save();

    // Add calculated discount percentage
    const enrichedProduct = {
      ...updatedProduct.toObject(),
      discountPercentage: finalMrp > 0 ? Math.round(((finalMrp - finalSellingPrice) / finalMrp) * 100) : 0
    };

    res.json(enrichedProduct);
  } catch (err) {
    console.error('Error updating product:', err);
    // Clean up uploaded file if update fails (using absolute path)
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlink(req.file.path, (unlinkErr) => {
        if (unlinkErr) {
          console.error('Error cleaning up failed upload:', unlinkErr);
        }
      });
    }
    res.status(400).json({ message: err.message || 'Invalid data provided for product update' });
  }
});

// DELETE product
router.delete('/:id', async (req, res) => {
  try {
    const deletedProduct = await Product.findById(req.params.id);
    if (!deletedProduct) {
      return res.status(404).json({ message: 'Product not found' });
    }
    // Delete associated image if exists (using relative path from DB)
    if (deletedProduct.image) {
      const fullImagePath = getFullImagePath(deletedProduct.image);
      if (fullImagePath && fs.existsSync(fullImagePath)) {
        fs.unlink(fullImagePath, (unlinkErr) => {
          if (unlinkErr) {
            console.error('Error deleting product image:', unlinkErr);
          }
        });
      }
    }
    await Product.findByIdAndDelete(req.params.id);
    res.json({ message: 'Product deleted successfully' });
  } catch (err) {
    console.error('Error deleting product:', err);
    res.status(500).json({ message: 'Server error while deleting product' });
  }
});

module.exports = router;