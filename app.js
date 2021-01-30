const express = require("express");
const morgan = require("morgan");
const cookieParser = require("cookie-parser");
const rateLimit = require("express-rate-limit");
const helmet = require("helmet");
const mongoSanitize = require("express-mongo-sanitize");
const xss = require("xss-clean");
const hpp = require("hpp");
const path = require("path");
const AppError = require("./utils/appError");
const globalErrorHandler = require("./controllers/errorController");

const viewRouter = require("./routes/viewRoutes");
const userRouter = require("./routes/userRoutes");
const noteRouter = require("./routes/noteRoutes");

const app = express();

app.set("view engine", "pug");
app.set("views", path.join(__dirname, "views"));
// 1) GLOBAL MIDDLEWARES
// Set security HTTP headers
app.use(helmet());

// Development logging
if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

// Limit requests from same API
const limiter = rateLimit({
  max: 100,
  windowMs: 60 * 60 * 1000,
  message: "Too many requests from this IP, please try again in an hour!",
});
app.use("/api", limiter);

// Body parser, reading data from body into req.body
app.use(express.json());

// Cookie Body parser, reading cookie from req
app.use(cookieParser());

// Data sanitization against NoSQL query injection
app.use(mongoSanitize());

// Data sanitization against XSS
app.use(xss());

// Prevent parameter pollution
app.use(
  hpp({
    whitelist: [],
  })
);

// 3) ROUTES

app.use("/", viewRouter);
app.use("/api/v1/users", userRouter);
app.use("/api/v1/notes", noteRouter);
app.use(express.static("public"));

app.all("*", (req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

app.use(globalErrorHandler);

module.exports = app;
