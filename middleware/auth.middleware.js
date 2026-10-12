import jwt from "jsonwebtoken";
import { pool } from "../src/lib/database.js";


export const protectRoute = async (req, res, next) => {
    try {
        const token = req.cookies.jwt;

        if (!token) {
            return res.status(401).json({ message: "Unauthorized - No Token Provided" });
        };
        
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        if (!decoded) {
            return res.status(401).json({ message: "Unauthorized - Invalid Token" });
        }
        const userQuery = await pool.query("SELECT * FROM users WHERE id = $1", [decoded.id]);

        if (userQuery.rows.length === 0) {
            return res.status(404).json({ message: "User not found" });
        }
        const { password, ...userWithoutPassword } = userQuery.rows[0];

        req.user = userWithoutPassword;

        next();
    } catch (error) {
        console.error("Error in auth middleware:", error.message);
        return res.status(500).json({ message: "Internal Server Error" });
    }
};
