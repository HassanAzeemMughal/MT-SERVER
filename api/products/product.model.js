const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, trim: true },
    categories: [{ type: mongoose.Schema.Types.ObjectId, ref: "Category" }],
    images: [{ type: mongoose.Schema.Types.ObjectId, ref: "File" }],
    price: { type: Number },
    offerPrice: { type: Number },
    discount: { type: Number },
    deliveryTime: { type: String },
    stock: { type: String },
    stock_quantity: { type: String },
    low_stock_alert: { type: String },
    attachments: [{ type: String }],
    description: { type: String },
    brands: [
      { type: mongoose.Schema.Types.ObjectId, ref: "Brand", default: null },
    ],
    status: { type: String, trim: true },
    seo: {
      title: { type: String, trim: true },
      keywords: [{ type: String, trim: true }],
      description: { type: String, trim: true },
    },
    attributes: [
      {
        attribute: { type: mongoose.Schema.Types.ObjectId, ref: "Attribute" },
        selectedValues: [{ type: String }],
      },
    ],
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);

const Product = mongoose.model("Product", productSchema);

module.exports = Product;
