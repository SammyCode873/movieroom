import { pool } from "../lib/database.js";
import express from "express"
const router = express.Router()


export const createMovie = async (req, res) => {
    const { movie_title, overview, genre, releaseyear, posterurl, createdby } = req.body;
    if (!movie_title || !overview || !genre || !releaseyear || !posterurl || !createdby) {
        res.status(400).json(
            { message: "All fields are required" }
        );
    };
    const existingMovie = await pool.query("SELECT * FROM movies WHERE movie_title=$1 OR createdby=$2", [movie_title, createdby])
    if (existingMovie) {
        res.json({
            message: "This movie already exists"
        })
    }
    const result = await pool.query("INSERT INTO movies (movie_title, overview, genre, releaseyear, posterurl, createdby) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *", [movie_title, overview, genre, releaseyear, posterurl, createdby])
    const new_movie = result.rows[0]
    res.status(201).json(
        {
            success: true,
            message: "Movie created successfully",
            data: new_movie
        }
    )
}


export const getMovies = async (req, res) => {
    try {
        const request = await pool.query("SELECT * FROM movies");
        res.status(200).json({
            success: true,
            data: request.rows
        })
    } catch (error) {
        res.status(500).json({
            message: "An internal server error occured"
        })
        process.exit(1)
    }
}



export const deleteMovie = async (req, res) => {
    try {
        const { id } = req.params;
        const existingMovie = await pool.query("SELECT * FROM movies WHERE id = $1", [id]);
        if (existingMovie.rows.length === 0) {
            return res.status(404).json({
                message: "This movie does not exist"
            });
        }
        await pool.query("DELETE FROM movies WHERE id = $1", [id]);
        return res.status(200).json({
            message: "Movie deleted successfully"
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Server error" });
    }
};
