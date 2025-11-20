const mongoose = require("mongoose");

const gallerySchema = new mongoose.Schema(
  {
    image: { type: String, required: true }, // path only
  },
  { timestamps: true }
);

module.exports = mongoose.model("Gallery", gallerySchema);
