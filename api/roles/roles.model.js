const mongoose = require("mongoose");

const rolesSchema = new mongoose.Schema(
  {
    name: {
      type: String,
    },
    slug: {
      type: String,
    },
    permissions: [String],
    status: {
      type: Boolean,
    },
  },
  {
    timestamps: true,
  }
);

const Roles = mongoose.model("Roles", rolesSchema);

module.exports = Roles;
