import Fastify from 'fastify';
import jwt from '@fastify/jwt';
import cors from '@fastify/cors';
import websocket from '@fastify/websocket';
import axios from 'axios';
import { ChatService } from './services/chatService';

// Define the JWT payload interface
interface JwtPayload {
  id: number;
}

const fastify = Fastify({ logger: true });

// Register JWT with options
fastify.register(jwt, {
  secret: process.env.JWT_SECRET || 'your-secret-key',
});

fastify.register(cors, {
  origin: ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:4000','http://localhost:3003'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
});

fastify.register(websocket);

const chatService = new ChatService();

fastify.get('/api/chat', { websocket: true }, (connection, req) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    connection.socket.close();
    return;
  }

  let userId: number;
  try {
    const decoded = fastify.jwt.verify<JwtPayload>(token);
    userId = decoded.id;
  } catch (err) {
    connection.socket.close();
    return;
  }

  connection.socket.on('message', async (message: string | Buffer) => {
    const msg = message.toString();
    console.log('Received message:', msg);

    // Save message to database
    await chatService.saveChatMessage(userId, msg);

    // Fetch user details from user-service
    let username = 'Unknown';
    try {
      const response = await axios.get(`http://user-service:3000/api/users/${userId}`);
      username = response.data.username;
    } catch (error) {
      console.error('Error fetching user:', error);
    }

    // Broadcast message to all connected clients
    fastify.websocketServer.clients.forEach((client: WebSocket) => {
      if (client.readyState === 1) {
        client.send(JSON.stringify({ userId, username, content: msg, createdAt: new Date().toISOString() }));
      }
    });
  });

  connection.socket.on('close', () => {
    console.log('Client disconnected');
  });
});

const start = async () => {
  try {
    await fastify.listen({ port: 4000, host: '0.0.0.0' });
    console.log('Chat Service running on http://0.0.0.0:4000');
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();