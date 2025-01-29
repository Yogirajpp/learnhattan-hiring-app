import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import mongoose from 'mongoose';
import { Server } from 'socket.io';
import router from './routes/routes.js';
import { socketHandler } from './utils/socketInstance.js';
import http from 'http';

dotenv.config();

const app = express();

// Environment variables
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use(express.json());
app.use('/api', router);

// Connect to MongoDB
mongoose
  .connect(MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log('MongoDB connected successfully!'))
  .catch(err => console.error('MongoDB connection error:', err));

//socket io conn
  const server = http.createServer(app);
  const io = new Server(server);
  
  // Handle socket connections
  socketHandler(io);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
