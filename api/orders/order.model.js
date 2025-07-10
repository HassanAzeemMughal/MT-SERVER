const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const orderSchema = new Schema(
  {
    orderRef: {
      type: String,
      required: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true, // This is causing the validation error
    },
    deliveryAddress: {
      firstName: { type: String },
      lastName: { type: String },
      email: { type: String },
      phone: { type: String },
      postcode: { type: String },
      addressLine1: { type: String },
      addressLine2: { type: String },
      city: { type: String },
      country: { type: String },
    },
    shippingMethod: {
      type: Schema.Types.ObjectId,
      ref: "ShippingMethod",
      required: false,
    },
    total: { type: Number },
    notes: { type: String },
    status: { type: String },
    trackingNo: { type: String },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Order", orderSchema);
