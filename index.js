import express from "express";
import "dotenv/config";

import cors from "cors";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import "express-async-errors";
import morgan from "morgan";
import mongoose from "mongoose";

import connectDB from "./config/database.js";

import {authenticate} from "./middleware/auth.js";
import authRoutes from "./routes/auth.js";


const app = express();

const PORT = process.env.PORT || 5000;


app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(cookieParser());

app.use(
  helmet({
    crossOriginEmbedderPolicy: false,
  })
);

app.use(morgan("dev"));



app.use(
  cors({
    origin: process.env.FRONTEND_URL,
    credentials: true,
  })
);

app.set("trust proxy", 1);


app.use("/api/auth", authRoutes);



app.get("/api/dashboard", authenticate, (req, res) => {
    res.json({
        message: "Welcome to your dashboard",
        user: req.user,
        stats: {
            totalProjects: 12,
            completedTasks: 84,
            pendingReviews: 5,
            hoursLogged: 128.5,
        },
        activities: [
            { id: 1, title: "Updated Authentication Flow", category: "Security", status: "Completed", date: "2026-07-28" },
            { id: 2, title: "Refactored Axios Interceptors", category: "Networking", status: "Completed", date: "2026-07-28" },
            { id: 3, title: "Designed Mockup Dashboard UI", category: "Frontend", status: "In Progress", date: "2026-07-28" },
            { id: 4, title: "Database Query Optimization", category: "Backend", status: "Pending", date: "2026-07-27" }
        ],
        notifications: [
            { id: 101, message: "Security patch applied successfully.", time: "10 mins ago" },
            { id: 102, message: "New team member assigned to project.", time: "2 hours ago" }
        ]
    });
});



app.get("/api/health", (req,res)=>{
    res.json({
        status:"OK"
    });
});



app.use((req,res)=>{
    res.status(404).json({
        message:"Route not found"
    });
});


app.use((err, req, res, next) => {
    console.error(err);

    res.status(err.status || 500).json({
        message: err.message || "Internal Server Error"
    });
});


let server;

connectDB()
    .then(() => {
        server = app.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
        });
    })
    .catch(console.error);

const gracefulShutdown = async () => {
    console.log("Shutting down gracefully...");
    if (server) {
        server.close(() => {
            console.log("HTTP server closed.");
        });
    }
    try {
        await mongoose.connection.close();
        console.log("MongoDB connection closed.");
        process.exit(0);
    } catch (err) {
        console.error("Error during MongoDB disconnect:", err);
        process.exit(1);
    }
};

process.on("SIGINT", gracefulShutdown);
process.on("SIGTERM", gracefulShutdown);