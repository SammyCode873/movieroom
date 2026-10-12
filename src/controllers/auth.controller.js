
import { pool } from "../lib/database.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { generateToken } from "../utils/generateToken.js";

// SIGNUP
export const Signup = async (req, res) => {
    try {
        const { fullname, email, password } = req.body;

        if (
            typeof fullname !== "string" ||
            typeof email !== "string" ||
            typeof password !== "string" ||
            !fullname.trim() ||
            !email.trim() ||
            !password
        ) {
            return res.status(400).json({
                success: false,
                message: "Please provide your full name, email, and password.",
            });
        }

        const cleanName = fullname.trim();
        const cleanEmail = email.trim().toLowerCase();

        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
            return res.status(400).json({
                success: false,
                message: "Please provide a valid email address.",
            });
        }

        if (password.length < 8) {
            return res.status(400).json({
                success: false,
                message: "Password must be at least 8 characters long.",
            });
        }

        const existingUser = await pool.query(
            "SELECT id FROM users WHERE email = $1",
            [cleanEmail]
        );

        if (existingUser.rows.length > 0) {
            return res.status(409).json({
                success: false,
                message: "An account with this email already exists.",
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const result = await pool.query(
            `INSERT INTO users (fullname, email, password)
             VALUES ($1, $2, $3)
             RETURNING id, fullname, email`,
            [cleanName, cleanEmail, hashedPassword]
        );

        const user = result.rows[0];

        // IMPORTANT: Match the generateToken argument order.
        const token = generateToken(
            user.id,
            res,
            user.fullname,
            user.email
        );

        return res.status(201).json({
            success: true,
            message: "User successfully created.",
            data: {
                user,
                token,
            },
        });
    } catch (error) {
        console.error("Signup error:", error);

        // Handles duplicate emails if a concurrent request
        // bypasses the initial SELECT query.
        if (error.code === "23505") {
            return res.status(409).json({
                success: false,
                message: "An account with this email already exists.",
            });
        }

        return res.status(500).json({
            success: false,
            message: "Unable to complete signup. Please try again.",
        });
    }
};

// LOGIN
export const Login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (
            typeof email !== "string" ||
            typeof password !== "string" ||
            !email.trim() ||
            !password
        ) {
            return res.status(400).json({
                success: false,
                message: "Please provide your email and password.",
            });
        }

        const cleanEmail = email.trim().toLowerCase();

        const result = await pool.query(
            `SELECT id, fullname, email, password
             FROM users
             WHERE email = $1`,
            [cleanEmail]
        );

        if (result.rows.length === 0) {
            return res.status(401).json({
                success: false,
                message: "Invalid email or password.",
            });
        }

        const user = result.rows[0];

        const isPasswordValid = await bcrypt.compare(
            password,
            user.password
        );

        if (!isPasswordValid) {
            return res.status(401).json({
                success: false,
                message: "Invalid email or password.",
            });
        }

        // Generate the token with all required user information.
        const token = generateToken(
            user.id,
            res,
            user.fullname,
            user.email
        );

        return res.status(200).json({
            success: true,
            message: "Login successful.",
            data: {
                user: {
                    id: user.id,
                    fullname: user.fullname,
                    email: user.email,
                },
                token,
            },
        });
    } catch (error) {
        console.error("Login error:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to complete login. Please try again.",
        });
    }
};

export const getMe = (req, res) => {
    try {
        const token = req.cookies?.jwt;

        if (!token) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized. Please log in.",
            });
        }

        const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET
        );

        return res.status(200).json({
            success: true,
            data: {
                user: {
                    id: decoded.id,
                    fullname: decoded.fullname,
                    email: decoded.email,
                },
            },
        });
    } catch (error) {
        return res.status(401).json({
            success: false,
            message: "Invalid or expired token. Please log in again.",
        });
    }
};


export const Logout = (req, res) => {
    res.clearCookie("jwt", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        path: "/",
    });

    return res.status(200).json({
        success: true,
        message: "Logged out successfully.",
    });
};
