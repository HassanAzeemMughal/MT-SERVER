const mongoose = require("mongoose");

// Define the OrderProduct schema
const orderProductSchema = new mongoose.Schema(
  {
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      required: true, // Reference to the order
    },
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true, // Reference to the product
    },
    quantity: { type: Number, required: true, min: 1 }, // Quantity ordered
    unitPrice: { type: Number, required: true, min: 0 }, // Unit price at the time of order
    totalPrice: { type: Number, required: true, min: 0 }, // Total price (quantity * unitPrice)
    discount: { type: Number, default: 0 },
    isMultiBuyApplied: { type: Boolean, default: false },
    status: { type: String },
  },
  { timestamps: true }
);

const OrderProduct = mongoose.model("OrderProduct", orderProductSchema);

module.exports = OrderProduct;
