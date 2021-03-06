const express = require("express");
const viewsController = require("../controllers/viewsController");
const authController = require("../controllers/authController");

const router = express.Router();

router.get("/", viewsController.getOverview);
router.get("/login", viewsController.getLoginForm);
router.get("/notes", authController.protect, viewsController.getNotes);

module.exports = router;
