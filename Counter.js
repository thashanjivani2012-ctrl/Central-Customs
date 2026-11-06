const mongoose = require("mongoose");

const { model, Schema } = mongoose;

const counterSchema = new Schema({
  _id: String,
  lastTicketNumber: {
    type: Number,
    default: 0,
  },
  type: {
    type: String,
    unique: true,
    sparse: true,
  }
});

const Counter = model("Counter", counterSchema);

module.exports = Counter;
