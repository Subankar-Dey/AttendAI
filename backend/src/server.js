
import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import app from './app.js';
import { Server } from 'socket.io';

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ MongoDB connected successfully');

    const server = app.listen(PORT, () => {
      console.log(`🚀 AttendAI API running on port ${PORT}`);
    });
    // --- SOCKET.IO INTEGRATION ---
    const io = new Server(server, {
      cors: {
        origin: process.env.FRONTEND_URL || 'http://localhost:5173',
        credentials: true
      }
    });
    global._io = io;
    io.on('connection', (socket) => {
      console.log('🔔 Socket.IO client connected:', socket.id);
      socket.on('disconnect', () => {
        console.log('Socket.IO client disconnected:', socket.id);
      });
    });
  } catch (error) {
    console.error('❌ MongoDB connection error:', error.message);
    process.exit(1);
  }
};

startServer();