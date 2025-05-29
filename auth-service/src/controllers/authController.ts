import { FastifyRequest, FastifyReply } from 'fastify';
import { AuthService } from '../services/authService';
import { validateEmail, validatePassword } from '../utils/validator';
import axios from 'axios';

export const authController = {
    async register(req: FastifyRequest, reply: FastifyReply) {
        const { username, email, password } = req.body as { username: string; email: string; password: string };
        if (!email || !username || !password) {
            return reply.status(400).send({ error: 'All fields are required' });
        }
        if (!validateEmail(email)) {
            return reply.status(400).send({ error: 'Invalid email format' });
        }
        if (!validatePassword(password)) {
            return reply.status(400).send({ error: 'Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character (@$!%*?&)' });
        }
        const authService = new AuthService(req.server);
        try {
            const result = await authService.register(username, email, password);
            return reply.status(201).send(result);
        } catch (error) {
            return reply.status(500).send({ error: 'Registration failed' });
        }
    },

    async login(req: FastifyRequest, reply: FastifyReply) {
        const { email, password, twoFactorCode } = req.body as { email: string; password: string; twoFactorCode?: string };
        const authService = new AuthService(req.server);
        try {
            const result = await authService.login(email, password, twoFactorCode);
            return reply.send(result);
        } catch (error: any) {
            return reply.status(401).send({ error: error.message });
        }
    },

    async logout(req: FastifyRequest, reply: FastifyReply) {
        const authService = new AuthService(req.server);
        try {
            await authService.logout();
            return reply.status(200).send({ message: 'Logged out' });
        } catch (error) {
            return reply.status(500).send({ error: 'Logout failed' });
        }
    },

    async changePassword(req: FastifyRequest, reply: FastifyReply) {
        const { id, password } = req.body as { id: number; password: string };
        if (!validatePassword(password)) {
            return reply.status(400).send({ error: 'Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character (@$!%*?&)' });
        }
        const authService = new AuthService(req.server);
        try {
            const result = await authService.updatePassword(id, password);
            return reply.send(result);
        } catch (error) {
            return reply.status(500).send({ error: 'Failed to update password' });
        }
    },

    async enable2FA(req: FastifyRequest, reply: FastifyReply) {
        const userId = (req.user as any).userId;
        const authService = new AuthService(req.server);
        try {
            const result = await authService.enable2FA(userId);
            return reply.send(result);
        } catch (error) {
            return reply.status(500).send({ error: 'Failed to enable 2FA' });
        }
    },

    async verify2FA(req: FastifyRequest, reply: FastifyReply) {
        const { code } = req.body as { code: string };
        const userId = (req.user as any).userId;
        const authService = new AuthService(req.server);
        try {
            const result = await authService.verify2FA(userId, code);
            return reply.send(result);
        } catch (error) {
            return reply.status(401).send({ error: 'Invalid 2FA code' });
        }
    },

    async disable2FA(req: FastifyRequest, reply: FastifyReply) {
        const userId = (req.user as any).userId;
        const authService = new AuthService(req.server);
        try {
            const result = await authService.disable2FA(userId);
            return reply.send(result);
        } catch (error) {
            return reply.status(500).send({ error: 'Failed to disable 2FA' });
        }
    },

    async googleCallback(req: FastifyRequest, reply: FastifyReply) {
        const authService = new AuthService(req.server);
        try {
            const { token } = await (req.server as any).googleOAuth2.getAccessTokenFromAuthorizationCodeFlow(req);
            const response = await axios.get('https://www.googleapis.com/oauth2/v2/userinfo', {
                headers: { Authorization: `Bearer ${token.access_token}` },
            });
            const googleUser = {
                id: response.data.id,
                email: response.data.email,
                displayName: response.data.name,
            };
            const result = await authService.googleSignIn(googleUser);
            return reply.send(result);
        } catch (error) {
            console.error('Google callback error:', error);
            return reply.status(500).send({ error: 'Google Sign-In failed' });
        }
    },
};