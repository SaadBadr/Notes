const express = require("express");
const noteController = require("./../controllers/noteController");
const authController = require("./../controllers/authController");

const router = express.Router();

router
  .route("/")
  .post(authController.protect, noteController.createNote)
  .get(authController.protect, noteController.getAllNotes);

router
  .route("/:id")
  .patch(authController.protect, noteController.editNote)
  .delete(authController.protect, noteController.deleteNote)
  .get(authController.protect, noteController.getNote);

module.exports = router;
