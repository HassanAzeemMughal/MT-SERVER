const mongoose = require("mongoose");

// Define the Attribute schema
const attributeSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true },
    values: [{ type: String, required: true }],
  },
  { timestamps: true }
);

const Attribute = mongoose.model("Attribute", attributeSchema);

module.exports = Attribute;
