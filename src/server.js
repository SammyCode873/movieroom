import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { authroutes } from "./routes/auth.routes.js";
import { movieRoutes } from "./routes/movie.route.js";

dotenv.config();

const app = express();

app.use(
    cors({
        origin: "http://localhost:5173",    
        credentials: true,
    })
);

app.use(express.json());

app.use("/auth", authroutes);

app.use("/movies", movieRoutes)


const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
