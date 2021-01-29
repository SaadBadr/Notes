const User = require("./../models/userModel");
const AppError = require("./../utils/appError");
const catchAsync = require("./../utils/catchAsync");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const sendEmail = require("./../utils/email");

const { promisify } = require("util");

const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });

const createSendToken = (user, statusCode, res) => {
  const token = signToken(user._id);
  user.password = undefined;

  res.cookie("jwt", token, {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
    ),
    secure: process.env.NODE_ENV === "production", //only https
    httpOnly: true,
  });

  res.status(statusCode).json({
    status: "success",
    token,
    data: {
      user,
    },
  });
};

exports.signup = catchAsync(async (req, res, next) => {
  const newUser = await User.create(req.body);
  createSendToken(newUser, 201, res);
});

exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return next(new AppError("please provide email and password!", 400));
  }

  const user = await User.findOne({ email }).select("+password");

  if (!user || !(await user.correctPassword(password, user.password))) {
    return next(new AppError("email/password is incorrect", 400));
  }
  createSendToken(user, 200, res);
});

exports.protect = catchAsync(async (req, res, next) => {
  const token = req.headers.authorization.split(" ")[1];
  // 1.check token exist

  if (!token) return next(new AppError("please login first.", 401));

  // 2.verify token

  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

  // 3.check if user exist

  const user = await User.findById(decoded.id);

  if (!user) return next(new AppError("user does not exist", 401));

  // 4.check if user changed password after token issued
  if (user.ifPasswordChangedAfter(decoded.iat))
    return next(new AppError("password changed, login again", 401));

  req.user = user;
  next();
});

exports.forgotPassword = async (req, res, next) => {
  // 1. get user based on mail
  const user = await User.findOne({ email: req.body.email });

  if (!user) return next(new AppError("user not found!", 404));

  // 2. generate random reset token
  const resetToken = user.createPasswordResetToken();
  await user.save({ validateBeforeSave: false });
  // 3. send it to user mail
  const resetURL = `${req.protocol}://${req.get(
    "host"
  )}/api/v1/users/resetPassword/${resetToken}`;

  const message = `forgot your password? submit a PATCH request with your new password and passwordConfirm to:\n${resetURL}\nif you didn't, please ignore this email!`;

  try {
    await sendEmail({
      email: user.email,
      subject: "your password reset token {only valid for 10MIN!}",
      message,
    });

    res.status(200).json({
      status: "success",
      message: "please check your email! token sent....",
    });
  } catch (error) {
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });
    return next(new AppError("sorry, please try again later!"), 500);
  }
};
exports.resetPassword = catchAsync(async (req, res, next) => {
  // 1. get user based on the token
  const hashedToken = crypto
    .createHash("sha256")
    .update(req.params.token)
    .digest("hex");

  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gte: Date.now() },
  });

  if (!user) return next(new AppError("token not valid!!"), 400);

  // 2. if token not expired and there is a user : set the new password
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  // 3. update changePasswordAt property

  await user.save();

  // 4. log user in, send JWT

  createSendToken(user, 200, res);
});

exports.updatePassword = catchAsync(async (req, res, next) => {
  // 1. get user from the collection

  const user = await User.findById(req.user._id).select("+password");

  // 2. check if the posted password is correct

  // const { password, passwordConfirm, passwordCurrent } = req.body;

  if (!(await user.correctPassword(req.body.passwordCurrent, user.password))) {
    return next(new AppError("password is incorrect."), 401);
  }

  // 3. if the password is correct then update it

  user.password = req.body.password;

  user.passwordConfirm = req.body.passwordConfirm;

  try {
    await user.save();
  } catch (error) {
    console.log(error);
  }

  // 4. log the user in => send a new token!

  createSendToken(user, 200, res);
});
