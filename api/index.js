import express from "express";
import dotenv from "dotenv";
import mongoose from "mongoose";
import authRoute from "./routes/auth.js"
import userRoute from "./routes/user.js"
import cookieParser from "cookie-parser";
const app = express()

app.listen(8800, () => {
    connect()
    console.log("Connected to backend!")
})

dotenv.config()

const connect = async () => {

    try {
        await mongoose.connect(process.env.MONGO);
        console.log("connected to mongoDB")
    } catch (error) {
        throw error;
    }
}


mongoose.connection.on("disconnect", () => {
    console.log("MongoDB disconnected.")
})
mongoose.connection.on("connected", () => {
    console.log("MongoDB is connected.")
})




//middleware
app.use(express.json())
app.use(cookieParser())

app.use("/api/auth", authRoute)
app.use("/api/user", userRoute)


app.use((err, req, res, next) => {
    const errorStatus = err.status || 500
    const errorMessage = err.message || "Something went wrong"
    return res.status(errorStatus).json({
        success: false,
        status: errorStatus,
        message: errorMessage,
        stack: err.stack
    })
})