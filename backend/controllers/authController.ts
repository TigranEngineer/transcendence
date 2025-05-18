import { AuthService } from '../services/authService';
import { RegisterRequest, LoginRequest, AuthResponse } from '../models/authModel';

export class AuthController {
  private authService: AuthService;

  constructor(fastify: any) {
    this.authService = new AuthService(fastify);
  }

  async register(request: any, reply: any) {
    console.log('AuthController: Processing register request:', request.body);
    const { username, email, password } = request.body;
    const result = await this.authService.register(username, email, password);
    console.log('AuthController: Register result:', result);
    return reply.send(result);
  }

  async login(request: any, reply: any) {
    const { email, password } = request.body;
    const result = await this.authService.login(email, password);
    return reply.send(result);
  }

  async logout(request: any, reply: any) {
    return reply.status(200).send({ message: 'Logged out' });
  }
}