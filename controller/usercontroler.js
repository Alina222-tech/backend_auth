const User = require("../model/usermodel.js");
const { v4: uuid } = require("uuid");
const fs = require("fs");
const path = require("path");
const cloudinary = require("../config/cloudinary.js");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const Reset = require("../model/resetpassword.model.js");
const crypto = require("crypto");
const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.ADMIN_EMAIL,
    pass: process.env.SEND_PASS,
  },
});

const register = async (req, res) => {
  try {
    const { First_Name, Last_Name, email, password, role } = req.body;
    if (!First_Name || !Last_Name || !email || !password) {
      return res.status(400).json({ message: "All fields are required." });
    }
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User already registered." });
    }
    let profileurl = "";
    if (req.files && req.files.profile_image) {
      const image = req.files.profile_image;
      const filename = `${uuid()}_${image.name}`;
      const uploadDir = path.join(__dirname, "_", "uploads");
      if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
      const uploadPath = path.join(uploadDir, filename);
      await image.mv(uploadPath);
      const uploadResult = await cloudinary.uploader.upload(uploadPath, {
        folder: "user_profile",
        public_id: uuid(),
      });
      profileurl = uploadResult.secure_url;
    } else {
      return res.status(400).json({ message: "Profile image is required." });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    await User.create({
      First_Name,
      Last_Name,
      email,
      password: hashedPassword,
      profile_image: profileurl,
      role: role || "User",
    });
    return res.status(201).json({ message: "User created successfully." });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ message: "All fields are required." });
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found." });
    const matched = await bcrypt.compare(password, user.password);
    if (!matched) return res.status(401).json({ message: "Invalid credentials." });
    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, {
      expiresIn: "1d",
    });
    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
    });
    return res.status(200).json({
      message: "User login successful.",
      user: {
        id: user._id,
        First_Name: user.First_Name,
        Last_Name: user.Last_Name,
        email: user.email,
        profile_image: user.profile_image,
        role: user.role,
      },
      token,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const logout = async (req, res) => {
  try {
    res.clearCookie("token", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
    });
    return res.status(200).json({ message: "User logged out successfully." });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "User not found." });
    const reset_token = crypto.randomBytes(32).toString("hex");
    await Reset.deleteMany({ userId: user._id });
    await Reset.create({
      userId: user._id,
      reset_token,
    });
    const resetLink = `${process.env.CLIENT_URL}/reset/${reset_token}`;
    await transporter.sendMail({
      to: user.email,
      subject: "Reset Password Link",
      html: `
        <h2>Password Reset Request</h2>
        <p>Click the link below to reset your password:</p>
        <a href="${resetLink}" target="_blank">${resetLink}</a>
        <p>If you didn't request this, please ignore this email.</p>
      `,
    });
    return res.status(200).json({ message: "Reset password link sent to your email." });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;
    const resetRecord = await Reset.findOne({ reset_token: token });
    if (!resetRecord)
      return res.status(400).json({ message: "Invalid or expired reset token." });
    const regex = /^(?=.*[a-z])(?=.*\d)(?=.*[!@$#%&*?])[A-Za-z\d!@#$%&*?]{8,}$/;
    if (!regex.test(password))
      return res.status(400).json({
        message:
          "Password must be at least 8 characters, include lowercase, number, and special character (!@$#%&*?).",
      });
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.findById(resetRecord.userId);
    if (!user) return res.status(404).json({ message: "User not found." });
    user.password = hashedPassword;
    await user.save();
    await Reset.findByIdAndDelete(resetRecord._id);
    return res.status(200).json({ message: "Password updated successfully." });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

module.exports = {
  register,
  login,
  logout,
  forgotPassword,
  resetPassword,
};
