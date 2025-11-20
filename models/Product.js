const mongoose = require("mongoose");
const slugify = require("slugify");

const productSchema = new mongoose.Schema(
  {
    productName: { type: String, required: true },
    unit: { type: String, enum: ['kg', 'liter'], required: true },
    quantity: { type: String, required: true },
    description: { type: String, default: "" },
    image: { type: String, default: "" },
    mrp: { type: Number, required: true }, // Maximum Retail Price (original price)
    sellingPrice: { type: Number, required: true }, // Discounted selling price
    slug: { type: String, unique: true } // IMPORTANT
  },
  { timestamps: true }
);

// Auto-generate slug before saving
productSchema.pre("save", function (next) {
  if (!this.slug && this.productName) {
    this.slug = slugify(this.productName + "-" + Date.now(), {
      lower: true,
      strict: true,
    });
  }
  // Optional: Validate sellingPrice <= mrp
  if (this.sellingPrice > this.mrp) {
    const err = new Error('Selling price cannot exceed MRP');
    return next(err);
  }
  next();
});

module.exports = mongoose.model("Product", productSchema);