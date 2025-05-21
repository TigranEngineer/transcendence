import { PrismaClient } from '@prisma/client';

export class ChatService {
    private prisma: PrismaClient;

    constructor() {
        this.prisma = new PrismaClient();
    }

    async saveChatMessage(userId: number, content: string) {
        try {
            const message = await this.prisma.chatMessage.create({
                data: { userId, content },
            });
            return message;
        } catch (error) {
            console.error('Prisma error saving chat message:', error);
            throw error;
        }
    }
}