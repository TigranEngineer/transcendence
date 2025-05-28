import { FastifyRequest, FastifyReply } from 'fastify';
import { UserService, CustomError } from '../services/userService';

async function blockUser(req: FastifyRequest, reply: FastifyReply) {
    try {
        const { id, blockedId } = req.body as { id: number, blockedId: number };
        console.log(`id = ${id}`);
        console.log(`Block id = ${blockedId}`); // Assuming userId is in headers
        if (!id) {
            return reply.status(401).send({ error: 'Unauthorized' });
        }

        if (isNaN(blockedId)) {
            return reply.status(400).send({ error: 'Invalid blocked ID' });
        }

        const userService = new UserService();
        await userService.blockUser(+id, blockedId);

        return reply.status(200).send({ success: true });
    } catch (error) {
        req.log.error(error);
        if (error instanceof CustomError) {
            reply.status(400).send({ error: error.message });
        }
        return reply.status(500).send({ error: 'Internal server error' });
    }
}

export default blockUser;