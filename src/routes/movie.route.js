import express from "express"
import { createMovie, deleteMovie, getMovies } from "../controllers/movie.controller.js";

const movieRoutes = express.Router()

movieRoutes.post("/create-movie", createMovie)
movieRoutes.delete("/:id", deleteMovie)
movieRoutes.get("/get-movies", getMovies)

export { movieRoutes };

