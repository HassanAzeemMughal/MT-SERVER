const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    slug: { type: String, required: true },
    categories: [{ type: mongoose.Schema.Types.ObjectId, ref: "Category" }],
    images: [{ type: String }],
    price: { type: Number },
    offerPrice: { type: Number },
    discount: { type: Number },
    color: { type: [String] },
    size: { type: String },
    deliveryTime: { type: String },
    stock: { type: String },
    attachements: { type: String },
    description: { type: String },
    brands: [
      { type: mongoose.Schema.Types.ObjectId, ref: "Brand", default: null },
    ],
    status: { type: String, trim: true },
  },
  { timestamps: true }
);

const Product = mongoose.model("Product", productSchema);

module.exports = Product;
