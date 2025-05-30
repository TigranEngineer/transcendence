import { FastifyRequest, FastifyReply } from 'fastify';
import { UserService } from '../services/userService';

interface GetByIdParam {
    id: string;
}

async function getFriends(req: FastifyRequest<{ Params: GetByIdParam }>, reply: FastifyReply) {
    try {
        const userId = parseInt(req.params.id); 
        if (isNaN(userId)) {
            return reply.status(400).send({ error: 'Invalid user ID' });
        }

        const userService = new UserService();
        const { friends } = await userService.getFriends(userId);
        console.log(`${friends[0].username}`);

        return reply.status(200).send( friends );
    } catch (error) {
        req.log.error(error);
        if (error instanceof Error) {
            return reply.status(500).send({ error: error.message });
        }
        return reply.status(500).send({ error: 'Internal server error' });
    }
}

export default getFriends;