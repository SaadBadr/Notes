const catchAsync = require("../utils/catchAsync");
const User = require("./../models/userModel");

exports.getOverview = (req, res) => {
  res.status(200).render("base");
};

exports.getLoginForm = (req, res) => {
  res.status(200).render("login");
};

exports.getNotes = catchAsync(async (req, res) => {
  const user = await User.findById(req.user._id).populate({
    path: "notes",
    select: "title",
  });

  res.status(200).render("notes", {
    notes: user.notes,
  });
});
