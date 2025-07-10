const { Schema, model } = require("mongoose");

const resetPasswordSchema = new Schema(
  {
    id: {
      type: Number,
    },
    email: {
      type: String,
      required: true,
    },
    code: {
      type: String,
      required: true,
    },
    expiry: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

const ResetPassword = model("ResetPassword", resetPasswordSchema);

module.exports = ResetPassword;
