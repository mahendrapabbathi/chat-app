import "dotenv/config"
import express from "express"
import cors from "cors"
import http from "http"
import { connectDB } from "./lib/db.js";
import userRouter from "./routes/UserRoutes.js";
import messageRouter from "./routes/MessageRoutes.js";
import { Server } from "socket.io";

const app = express();
const server = http.createServer(app)

// Initialize Socket.io
export const io = new Server(server,{
    cors:{origin:"*"}
})

// store online users
export const userSocketMap = {}; // {userId : socketId}

// Socket.io connection handler
io.on("connection",(socket)=>{
    const userId = socket.handshake.query.userId;
    console.log("User Connected",userId);

    if(userId) userSocketMap[userId] = socket.id;

    // emit online users to all connected clients
    io.emit("getOnlineUsers", Object.keys(userSocketMap));

    socket.on("disconnect", ()=>{
        console.log("User Disconnected",userId);
        delete userSocketMap[userId];
        io.emit("getOnlineUsers", Object.keys(userSocketMap));
    })
})

// middleware
app.use(express.json({limit:"4mb"}))
app.use(cors())

app.use('/api/status',(req,res)=>res.send("Server is live"));
app.use('/api/auth',userRouter);
app.use('/api/messages',messageRouter);

await connectDB();

if(process.env.NODE_ENV !== "production"){
    const PORT = process.env.PORT || 5000;
server.listen(PORT,()=>console.log("Server is running on PORT: "+PORT))
}
// console.log("✅ Loaded Cloudinary API Key:", process.env.CLOUDINARY_API_KEY);

// exporting server for vercel
export default server;