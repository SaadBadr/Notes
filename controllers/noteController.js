const User = require("./../models/userModel");
const Note = require("./../models/noteModel");
const AppError = require("./../utils/appError");
const catchAsync = require("./../utils/catchAsync");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const { promisify } = require("util");

exports.createNote = catchAsync(async (req, res, next) => {
  const note = await Note.create(req.body);
  const user = await User.findById(req.user._id);
  user.notes.push(note);
  await user.save({ validateModifiedOnly: true });
  res.status(201).json({
    status: "success",
    data: {
      note,
    },
  });
});

exports.getAllNotes = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.user._id).populate({ path: "notes" });
  res.status(201).json({
    status: "success",
    data: {
      notes: user.notes,
    },
  });
});

exports.editNote = catchAsync(async (req, res, next) => {
  const note = await Note.findById(req.params.id);
  if (!req.user.notes.includes(note._id))
    return next(new AppError("Not authorized for edit!", 401));

  note.title = req.body.title || note.title;
  note.body = req.body.body || note.body;

  await note.save();

  res.status(200).json({
    status: "success",
    data: {
      note,
    },
  });
});

exports.deleteNote = catchAsync(async (req, res, next) => {
  const note = await Note.findById(req.params.id);
  if (!req.user.notes.includes(note._id))
    return next(new AppError("Not authorized for deletion!", 401));

  await note.remove();

  res.status(200).json({
    status: "success",
  });
});
