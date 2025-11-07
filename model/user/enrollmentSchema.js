// models/Enrollment.js
const mongoose = require("mongoose");

const schema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: true,
    },
    status: {
      type: String,
      enum: ["enrolled", "pending"], // pending for payment courses
    },
    enrolledAt: {
      type: Date,
      default: Date.now,
    },
    paymentId: {
      type: String, // optional, store Razorpay payment ID for paid courses
    },
    amount: {
      type: Number, // optional, store price paid
    },
    orderId: {
      type: String,
    }
  },
  { timestamps: true }
);

const EnrollmentSchema = mongoose.model('Enrollment', schema);

module.exports = EnrollmentSchema;
