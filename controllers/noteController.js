const User = require("./../models/userModel");
const Note = require("./../models/noteModel");
const AppError = require("./../utils/appError");
const catchAsync = require("./../utils/catchAsync");

exports.createNote = catchAsync(async (req, res, next) => {
  req.body.creator = req.user._id;
  const note = await Note.create(req.body);
  req.user.notes.push(note._id);
  await req.user.save({ validateModifiedOnly: true });
  res.status(201).json({
    status: "success",
    data: {
      note,
    },
  });
});

exports.getAllNotes = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.user._id).populate({
    path: "notes",
    select: "title",
  });
  res.status(201).json({
    status: "success",
    data: {
      notes: user.notes,
    },
  });
});

exports.getNote = catchAsync(async (req, res, next) => {
  const note = await Note.findById(req.params.id);

  if (!req.user._id.equals(note.creator))
    return next(new AppError("Not authorized!", 401));
  res.status(200).json({
    status: "success",
    data: {
      note,
    },
  });
});

exports.editNote = catchAsync(async (req, res, next) => {
  const note = await Note.findById(req.params.id);
  if (!req.user._id.equals(note.creator))
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
  if (!req.user._id.equals(note.creator))
    return next(new AppError("Not authorized for deletion!", 401));

  await note.remove();

  res.status(200).json({
    status: "success",
  });
});
