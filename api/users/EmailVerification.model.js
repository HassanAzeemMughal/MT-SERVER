const mongoose = require("mongoose");
const { Schema } = mongoose; // Destructure to get Schema

const EmailVerificationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    verificationToken: { type: String, required: true },
    verificationTokenExpires: {
      type: Date,
      default: Date.now,
      expires: 3600,
    },
  },
  { timestamps: true }
);

const EmailVerification = mongoose.model(
  "EmailVerification",
  EmailVerificationSchema
);

module.exports = EmailVerification;
