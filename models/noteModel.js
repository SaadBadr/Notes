const mongoose = require("mongoose");
const noteSchema = new mongoose.Schema({
  title: {
    type: String,
    default: "Untitled Note",
  },
  body: {
    type: String,
    default: "",
  },
  creator: {
    type: mongoose.Schema.ObjectId,
    ref: "User",
    required: true,
  },
});

const Note = mongoose.model("Note", noteSchema);

module.exports = Note;
