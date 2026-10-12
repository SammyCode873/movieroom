import { protectRoute } from "../../middleware/auth.middleware.js";
import { Signup, Login, getMe } from "../controllers/auth.controller.js"
import express from "express"
const authroutes = express.Router();

authroutes.post("/register", Signup);
authroutes.post("/login", Login);
authroutes.get("/me", protectRoute, getMe)
export { authroutes };