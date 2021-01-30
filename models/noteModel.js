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
});

const Note = mongoose.model("Note", noteSchema);

module.exports = Note;
