const mongoose = require("mongoose");
const { Schema } = mongoose; // Destructure to get Schema

const userSchema = new mongoose.Schema(
  {
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    email: { type: String, required: true },
    password: { type: String },
    phone: { type: String },
    dob: { type: Date },
    role: {
      type: Schema.Types.ObjectId,
      ref: "Roles", // Corrected to match the model name case ("Roles")
    },
    isVerified: { type: Boolean, default: false },
    postcode: { type: String },
    addressLine1: { type: String },
    addressLine2: { type: String },
    city: { type: String },
    country: { type: String },
    note: { type: String },
    photo: { type: String },
    status: { type: String },
  },
  { timestamps: true }
);

const User = mongoose.model("User", userSchema);

module.exports = User;
