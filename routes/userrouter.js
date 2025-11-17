const express = require("express");
const router = express.Router();

const {
  register,
  login,
  logout,
  forgotPassword,
  resetPassword
} = require("../controller/usercontroler.js");

router.post("/register", register);
router.post("/login", login);
router.post("/logout", logout);


router.post("/forgot", forgotPassword);
router.post("/reset/:token", resetPassword);

module.exports = router;
