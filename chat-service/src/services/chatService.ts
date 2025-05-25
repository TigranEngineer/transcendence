import axios from 'axios';
import { PrismaClient } from '@prisma/client';
import { WebSocket } from 'ws'; // Import WebSocket type from 'ws'

const prisma = new PrismaClient();

const connections = new Map<number, WebSocket>();

export const chatService = {
    registerConnection(userId: number, connection: WebSocket) {
        connections.set(userId, connection);
    },

    unregisterConnection(userId: number) {
        connections.delete(userId);
    },

    async isBlocked(userId: number, targetId: number): Promise<boolean> {
        try {
            const response = await axios.get(`http://user-service:3000/api/users/blocked`, {
                params: { blockedId: targetId },
            });
            return response.data.isBlocked;
        } catch (error) {
            console.error('Error checking block status:', error);
            return true;
        }
    },

    async isFriend(userId: number, targetId: number): Promise<boolean> {
        try {
            const response = await axios.get(`http://user-service:3000/api/users/friends`, {
                params: { friendId: targetId },
            });
            return response.data.isFriend;
        } catch (error) {
            console.error('Error checking friend status:', error);
            return false;
        }
    },

    async handleMessage(senderId: number, receiverId: number, content: string, connection: WebSocket) {
        const isSenderBlocked = await this.isBlocked(receiverId, senderId);
        const isReceiverBlocked = await this.isBlocked(senderId, receiverId);
        if (isSenderBlocked || isReceiverBlocked) {
            connection.send(JSON.stringify({ error: 'Cannot send message: user is blocked' }));
            return;
        }

        const areFriends = await this.isFriend(senderId, receiverId);
        if (!areFriends) {
            connection.send(JSON.stringify({ error: 'Cannot send message: users are not friends' }));
            return;
        }

        const savedMessage = await prisma.message.create({
            data: {
                content,
                senderId,
                receiverId,
                createdAt: new Date(),
            },
        });

        const receiverConnection = connections.get(receiverId);
        if (receiverConnection) {
            receiverConnection.send(
                JSON.stringify({
                    type: 'message',
                    content,
                    senderId,
                    createdAt: savedMessage.createdAt,
                })
            );
        }

        connection.send(
            JSON.stringify({
                type: 'message',
                content,
                receiverId,
                createdAt: savedMessage.createdAt,
            })
        );
    },
};