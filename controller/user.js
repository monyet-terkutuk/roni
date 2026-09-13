const express = require("express");
const User = require("../model/user");
const router = express.Router();
const ErrorHandler = require("../utils/ErrorHandler");
const catchAsyncErrors = require("../middleware/catchAsyncErrors");
const jwt = require("jsonwebtoken");
const { isAuthenticated, isAdmin } = require("../middleware/auth");
const Validator = require("fastest-validator");
const v = new Validator();
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const { sendMailForgotPW } = require("../utils/sendMail");

// User register
router.post("/register", async (req, res, next) => {
  try {
    const userSchema = {
      username: { type: "string", empty: false, max: 255 },
      password: { type: "string", empty: false, max: 255 },
      email: { type: "email", empty: false },
      address: { type: "string", optional: true },
      role: { type: "string", empty: false, max: 255 },
    };

    const { body } = req;

    // validation input data
    const validationResponse = v.validate(body, userSchema);

    if (validationResponse !== true) {
      return res.status(400).json({
        code: 400,
        status: "error",
        data: {
          error: "Validation failed",
          details: validationResponse,
        },
      });
    }

    const isEmailUsed = await User.findOne({ email: body.email });
    const isUsernameUsed = await User.findOne({ username: body.username });

    if (isEmailUsed || isUsernameUsed) {
      return res.status(400).json({
        code: 400,
        status: "error",
        data: {
          error: isEmailUsed ? "Email has been used" : "Username has been used",
        },
      });
    }

    const password = bcrypt.hashSync(body.password, 10);

    try {
      const user = await User.create({ ...body, password });
      return res.json({
        code: 200,
        status: "success",
        data: {
          id: user._id,
          username: user.username,
          email: user.email,
          address: user.address,
          role: user.role,
        },
      });
    } catch (error) {
      return res.status(500).json({
        code: 500,
        status: "error",
        data: error.message,
      });
    }
  } catch (error) {
    return next(new ErrorHandler(error.message, 400));
  }
});

// login user
router.post("/login", async (req, res, next) => {
  const { body } = req;

  const loginSchema = {
    email: { type: "email", empty: false },
    password: { type: "string", min: 8, empty: false },
  };

  try {
    // Validasi input
    const validationResponse = v.validate(body, loginSchema);
    if (validationResponse !== true) {
      return res.status(400).json({
        meta: {
          message: "Validation failed",
          code: 400,
          status: "error",
        },
        data: validationResponse,
      });
    }

    // Cari pengguna berdasarkan email
    const user = await User.findOne({ email: body.email });
    if (!user || !user.password) {
      return res.status(401).json({
        meta: {
          message: "Authentication failed. Please ensure your email and password are correct.",
          code: 401,
          status: "error",
        },
        data: null,
      });
    }

    // Periksa kecocokan kata sandi
    const isPasswordCorrect = bcrypt.compareSync(body.password, user.password);
    if (!isPasswordCorrect) {
      return res.status(401).json({
        meta: {
          message: "Authentication failed. Please ensure your email and password are correct.",
          code: 401,
          status: "error",
        },
        data: null,
      });
    }

    // Jika autentikasi berhasil, buat token JWT
    const payload = {
      id: user._id,
      role: user.role,
      // tambahkan bidang lain yang Anda butuhkan di token JWT
    };

    const secret = process.env.JWT_SECRET_KEY;
    const expiresIn = "24h"; // Gunakan "1h" untuk token yang berlaku selama 1 jam

    const token = jwt.sign(payload, secret, { expiresIn });

    // Kirim respons sukses dengan token JWT
    return res.status(200).json({
      meta: {
        message: "Authentication successful",
        code: 200,
        status: "success",
      },
      data: {
        id: user._id,
        username: user.username,
        email: user.email,
        address: user.address,
        role: user.role,
        token: token,
      },
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      meta: {
        message: "Internal Server Error",
        code: 500,
        status: "error",
      },
      data: error.message,
    });
  }
});

// Forgot password
router.post("/forgot-password", async (req, res, next) => {
  try {
    const emailInput = req.body.email ? req.body.email.trim() : "";
    if (!emailInput) {
      return res.status(400).json({
        code: 400,
        status: "error",
        message: "Email wajib diisi",
      });
    }

    const user = await User.findOne({
      email: { $regex: new RegExp(`^${emailInput.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i") },
    });
    if (!user) {
      return res.status(404).json({
        code: 404,
        status: "error",
        message: "Pengguna dengan email ini tidak ditemukan",
      });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString("hex");

    // Hash token to store in DB
    user.resetPasswordToken = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");

    // Token expires in 15 minutes
    user.resetPasswordExpire = Date.now() + 15 * 60 * 1000;

    await user.save();

    const frontendUrl = req.headers.origin || process.env.FRONTEND_URL || "http://localhost:3000";
    const resetUrl = `${frontendUrl}/reset-password?token=${resetToken}`;

    const waPhone = "6285150589797";
    const waMessage = `Halo Admin, berikut adalah link reset password akun RH Barbershop Anda (${user.email}):\n\n${resetUrl}\n\nLink ini berlaku selama 15 menit.`;
    const waUrl = `https://api.whatsapp.com/send?phone=${waPhone}&text=${encodeURIComponent(waMessage)}`;

    return res.status(200).json({
      code: 200,
      status: "success",
      message: "Link reset password berhasil dibuat. Mengarahkan ke WhatsApp...",
      waUrl,
      resetUrl,
    });
  } catch (error) {
    return next(new ErrorHandler(error.message, 500));
  }
});

// Reset password
router.post("/reset-password", async (req, res, next) => {
  try {
    const { token, password } = req.body;

    if (!token || !password) {
      return res.status(400).json({
        code: 400,
        status: "error",
        message: "Token dan password baru wajib diisi",
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        code: 400,
        status: "error",
        message: "Password minimal 8 karakter",
      });
    }

    // Hash token from req.body to compare with hashed token in DB
    const resetPasswordToken = crypto
      .createHash("sha256")
      .update(token)
      .digest("hex");

    const user = await User.findOne({
      resetPasswordToken,
      resetPasswordExpire: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({
        code: 400,
        status: "error",
        message: "Token tidak valid atau telah kadaluwarsa",
      });
    }

    // Set new password
    user.password = bcrypt.hashSync(password, 10);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;

    await user.save();

    return res.status(200).json({
      code: 200,
      status: "success",
      message: "Password berhasil diperbarui",
    });
  } catch (error) {
    return next(new ErrorHandler(error.message, 500));
  }
});

// Get all users
router.get(
  "/list",
  isAuthenticated,
  catchAsyncErrors(async (req, res, next) => {
    try {
      const users = await User.find().sort({ createdAt: -1 });

      res.status(200).json({
        meta: {
          message: "Users retrieved successfully",
          code: 200,
          status: "success",
        },
        data: users.map(user => ({
          id: user._id,
          username: user.username,
          email: user.email,
          address: user.address,
          role: user.role,
        })),
      });
    } catch (error) {
      console.error("Error:", error);
      return next(new ErrorHandler(error.message, 500));
    }
  })
);

// Get user by ID
router.get(
  "/:id",
  isAuthenticated,
  catchAsyncErrors(async (req, res, next) => {
    try {
      const user = await User.findById(req.params.id);
      if (!user) {
        return res.status(404).json({
          code: 404,
          message: 'User not found',
          data: null,
        });
      }

      res.status(200).json({
        meta: {
          message: "User retrieved successfully",
          code: 200,
          status: "success",
        },
        data: {
          id: user._id,
          username: user.username,
          email: user.email,
          address: user.address,
          role: user.role,
        },
      });
    } catch (error) {
      console.error("Error:", error);
      return next(new ErrorHandler(error.message, 500));
    }
  })
);

// Delete user
router.delete(
  "/delete/:id",
  isAuthenticated,
  catchAsyncErrors(async (req, res, next) => {
    try {
      const userId = req.params.id;

      // Cari dan hapus pengguna berdasarkan ID
      const user = await User.findByIdAndDelete(userId);

      if (!user) {
        return res.status(404).json({
          code: 404,
          message: 'User not found',
          data: null,
        });
      }

      return res.status(200).json({
        code: 200,
        message: 'User deleted successfully',
        data: null,
      });
    } catch (error) {
      return next(new ErrorHandler(error.message, 500));
    }
  })
);

module.exports = router;
