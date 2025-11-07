const mongoose = require('mongoose');

const schema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: ["free", "paid"],
    },
    price: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);


const courseSchema = mongoose.model('Course', schema);

module.exports = courseSchema;