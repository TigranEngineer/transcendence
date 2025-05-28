import { FastifyRequest, FastifyReply } from 'fastify';
import { UserService, CustomError } from '../services/userService';

async function addFriend(req: FastifyRequest, reply: FastifyReply) {
    try {
        const { id, friendId } = req.body as { id: number, friendId: number };
        console.log(`id = ${id}`);
        console.log(`Friend id = ${friendId}`);

        if (isNaN(friendId)) {
            return reply.status(400).send({ error: 'Invalid friend ID' });
        }

        const userService = new UserService();
        await userService.addFriend(id, friendId);
        
        return reply.status(200).send({ success: true });
    } catch (error) {
        req.log.error(error);
        if (error instanceof CustomError) {
            reply.status(400).send({ error: error.message });
        }
        return reply.status(500).send({ error: 'Internal server error' });
    }
}

export default addFriend;