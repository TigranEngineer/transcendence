import { PrismaClient } from '@prisma/client';

export class CustomError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'CustomError';
  }
}

export class UserService {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient();
  }

  async createUser(username: string, email: string) {
    try {
      const user = await this.prisma.user.create({
        data: { username, email },
      });
      return user;
    } catch (error) {
      console.error('Prisma error creating user:', error);
      throw error;
    }
  }

  async getUserById(id: number) {
    try {
      const user = await this.prisma.user.findUnique({ where: { id } });
      if (!user) throw new Error('User not found');
      return user;
    } catch (error) {
      console.error('Prisma error getting user:', error);
      throw error;
    }
  }

  async getUserByUsername(username: string) {
    try {
      const user = await this.prisma.user.findUnique({ where: { username } });
      if (!user) throw new Error('User not found');
      return user;
    } catch (error) {
      console.error('Prisma error getting user:', error);
      throw error;
    }
  }

  async addFriend(userId: number, friendId: number) {
    try {
      const existingFriendship = await this.prisma.friends.findUnique({
        where: { userId_friendId: { userId, friendId } },
      });
      if (existingFriendship) throw new CustomError('Already friends');

      await this.prisma.friends.create({
        data: { userId, friendId, createdAt: new Date() },
      });
      return { success: true };
    } catch (error) {
      console.error('Add friend failed:', error);
      throw error;
    }
  }

  async blockUser(blockerId: number, blockedId: number) {
    try {
      const existingBlock = await this.prisma.blocked.findUnique({
        where: { blockerId_blockedId: { blockerId, blockedId } },
      });
      if (existingBlock) throw new CustomError('Already blocked');

      await this.prisma.blocked.create({
        data: { blockerId, blockedId, createdAt: new Date() },
      });
      return { success: true };
    } catch (error) {
      console.error('Block user failed:', error);
      throw error;
    }
  }

  async updateUsername(userId: number, newUsername: string) {
    const existingUser = await this.prisma.user.findUnique({
      where: { username: newUsername },
    });
    if (existingUser && existingUser.id !== userId) {
      throw new CustomError('Username is already taken');
    }

    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: { username: newUsername },
    });

    return updatedUser;
  }

  async updatePhoto(userId: number, newPhoto: string) {
    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: { profilePhoto: newPhoto },
    });

    return updatedUser;
  }

  async getFriends(userId: number) {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        include: {
          friendsAsUser: {
            include: {
              friend: true, // Include the friend user details
            },
          },
          friendsAsFriend: {
            include: {
              user: true, // Include the user details for reverse relationships
            },
          },
        },
      });

      if (!user) throw new Error('User not found');

      // Combine friends from both directions and extract unique friend details
      const friends = [
        ...user.friendsAsUser.map(f => f.friend),
        ...user.friendsAsFriend.map(f => f.user),
      ].filter((friend, index, self) =>
        index === self.findIndex((f) => f.id === friend.id)
      );

      return {
        friends: friends.map(friend => ({
          id: friend.id,
          username: friend.username,
          profilePhoto: friend.profilePhoto,
        })),
      };
    } catch (error) {
      console.error('Get friends failed:', error);
      throw error;
    }
  }
}