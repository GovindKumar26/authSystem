import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import User from "../models/User.js";

const JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET;
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET;

const signAccessToken = (payload) =>
  jwt.sign(payload, JWT_ACCESS_SECRET, {
    expiresIn: process.env.ACCESS_TOKEN_EXPIRES || "15m",
  });

const signRefreshToken = (payload) =>
  jwt.sign(payload, JWT_REFRESH_SECRET, {
    expiresIn: process.env.REFRESH_TOKEN_EXPIRES || "7d",
  });

const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

export const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || name.trim().length < 2) {
      return res.status(400).json({
        error: "Name must be at least 2 characters.",
      });
    }

    if (!email || !password) {
      return res.status(400).json({
        error: "Email and password are required.",
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        error: "Password must be at least 6 characters.",
      });
    }

    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return res.status(409).json({
        error: "User already exists.",
      });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await User.create({
      name: name.trim(),
      email,
      passwordHash,
    });

    res.status(201).json({
      message: "Registration successful.",
      user: user.toJSON(),
    });
  } catch (err) {
    console.error("Register Error:", err);

    res.status(500).json({
      error: "Registration failed.",
    });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        error: "Email and password are required.",
      });
    }

    const user = await User.findOne({ email }).select("+passwordHash");

    if (!user) {
      return res.status(401).json({
        error: "Invalid email or password.",
      });
    }

    const validPassword = await user.comparePassword(password);

    if (!validPassword) {
      return res.status(401).json({
        error: "Invalid email or password.",
      });
    }

    const accessToken = signAccessToken({
      id: user._id,
    });

    const refreshToken = signRefreshToken({
      id: user._id,
    });

    res.cookie("refreshToken", refreshToken, cookieOptions);

    res.status(200).json({
      message: "Login successful.",
      accessToken,
      user: user.toJSON(),
    });
  } catch (err) {
    console.error("Login Error:", err);

    res.status(500).json({
      error: "Login failed.",
    });
  }
};

export const refreshToken = async (req, res) => {
  try {
    const token = req.cookies.refreshToken;

    if (!token) {
      return res.status(401).json({
        error: "Refresh token not found.",
      });
    }

    const payload = jwt.verify(token, JWT_REFRESH_SECRET);

    const accessToken = signAccessToken({
      id: payload.id,
    });

    res.status(200).json({
      accessToken,
    });
  } catch (err) {
    return res.status(401).json({
      error: "Invalid or expired refresh token.",
    });
  }
};

export const logout = async (req, res) => {
  res.clearCookie("refreshToken", cookieOptions);

  res.status(200).json({
    message: "Logged out successfully.",
  });
};

export const getMe = async (req, res) => {
  try {
    res.status(200).json({
      user: req.user,
    });
  } catch (err) {
    res.status(500).json({
      error: "Failed to fetch user.",
    });
  }
};