import { FastifyRequest } from 'fastify';
import jwt from 'jsonwebtoken';
import { chatService } from '../services/chatService';
import { WebSocket } from 'ws'; // Import WebSocket type from 'ws'

interface User {
  id: number;
  email: string;
}

interface WebSocketMessage {
  type: 'message';
  content: string;
  receiverId: number;
}

export const chatHandler = async (connection: WebSocket, req: FastifyRequest) => {
  // Authenticate WebSocket connection
  const token = req.headers['sec-websocket-protocol'];
  if (!token) {
    connection.close(1008, 'No token provided');
    return;
  }

  let user: User;
  try {
    user = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key') as User;
  } catch (error) {
    connection.close(1008, 'Invalid token');
    return;
  }

  // Register connection
  await chatService.registerConnection(user.id, connection);
  console.log(`User ${user.id} connected`);

  // Handle incoming messages
  connection.on('message', async (data: Buffer) => {
    try {
      const message: WebSocketMessage = JSON.parse(data.toString());
      if (message.type !== 'message') return;

      const { content, receiverId } = message;
      await chatService.handleMessage(user.id, receiverId, content, connection);
    } catch (error) {
      console.error('Error processing message:', error);
      connection.send(JSON.stringify({ error: 'Failed to process message' }));
    }
  });

  // Handle connection close
  connection.on('close', () => {
    chatService.unregisterConnection(user.id);
    console.log(`User ${user.id} disconnected`);
  });
};