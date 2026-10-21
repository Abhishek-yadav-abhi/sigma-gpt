import dns from "node:dns";

dns.setServers(["8.8.8.8", "8.8.4.4"]);
import express from "express";
import "dotenv/config";
import cors from "cors";
import mongoose from "mongoose";
import chatRoutes from "./routes/chat.js";

const app = express();
const PORT = Number(process.env.PORT) || 8080;

app.use(express.json());
app.use(cors());

// CHANGE: expose the chat and thread endpoints used by the React app.
app.use("/api", chatRoutes);
// CHANGE: lightweight endpoint to confirm the API is running without querying MongoDB.
app.get("/api/health", (_req, res) => res.json({ status: "ok" }));

app.listen(PORT, () => {
    console.log(`server running on ${PORT}`);
    connectDB();
});

const connectDB = async() => {
    if (!process.env.MONGODB_URI) {
        console.warn("MONGODB_URI is not configured; database features are unavailable.");
        return;
    }

    try {
        await mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 5000 });
        console.log("Connected with Database!");
    } catch(err) {
        console.log("Failed to connect with Db", err);
    }
}


// app.post("/test", async (req, res) => {
//     const options = {
//         method: "POST",
//         headers: {
//             "Content-Type": "application/json",
//             "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`
//         },
//         body: JSON.stringify({
//             model: "gpt-4o-mini",
//             messages: [{
//                 role: "user",
//                 content: req.body.message
//             }]
//         })
//     };

//     try {
//         const response = await fetch("https://api.openai.com/v1/chat/completions", options);
//         const data = await response.json();
//         //console.log(data.choices[0].message.content); //reply
//         res.send(data.choices[0].message.content);
//     } catch(err) {
//         console.log(err);
//     }
// });
