import { UserService } from '../services/userService';
import { UserResponse } from '../models/userModel';

export class UserController {
  private userService: UserService;

  constructor() {
    this.userService = new UserService();
  }

  async getUser(request: any, reply: any) {
    const user = await this.userService.getUser(request);
    return reply.send(user as UserResponse);
  }
}