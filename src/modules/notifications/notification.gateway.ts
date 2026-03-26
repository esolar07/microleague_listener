import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger, UseGuards } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { jwtConstants } from 'src/constants/jwt.constant';
import { UserService } from 'src/modules/user/user.service';

interface AuthenticatedSocket extends Socket {
  userId?: string;
  email?: string;
}

@WebSocketGateway({
  cors: {
    origin: '*',
    credentials: true,
  },
  namespace: '/notifications',
})
export class NotificationGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(NotificationGateway.name);
  private connectedClients = new Map<string, AuthenticatedSocket>();

  constructor(
    private readonly jwtService: JwtService,
    private readonly userService: UserService,
  ) {}

  async handleConnection(client: AuthenticatedSocket) {
    try {
      const token = this.extractTokenFromSocket(client);
      if (!token) {
        this.logger.warn(`Client ${client.id} disconnected: No token provided`);
        client.disconnect();
        return;
      }

      const user = await this.authenticateSocket(token);
      if (!user) {
        this.logger.warn(`Client ${client.id} disconnected: Invalid token`);
        client.disconnect();
        return;
      }

      client.userId = user.userId;
      client.email = user.email;

      // Join room for user-specific notifications
      if (user.userId) {
        client.join(`user:${user.userId}`);
      }
      if (user.email) {
        client.join(`email:${user.email}`);
      }

      this.connectedClients.set(client.id, client);

      this.logger.log(`Client connected: ${client.id} (User: ${user.userId || user.email})`);

      // Send connection confirmation
      client.emit('connected', {
        message: 'Connected to notification service',
        userId: user.userId,
        email: user.email,
      });
    } catch (error) {
      this.logger.error(`Error handling connection for client ${client.id}:`, error.stack);
      client.disconnect();
    }
  }

  handleDisconnect(client: AuthenticatedSocket) {
    this.connectedClients.delete(client.id);
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('ping')
  handlePing(@ConnectedSocket() client: AuthenticatedSocket) {
    return {
      event: 'pong',
      data: { timestamp: new Date().toISOString() },
    };
  }

  /**
   * Send notification to a specific user
   */
  sendToUser(userId: string, notification: any) {
    this.server.to(`user:${userId}`).emit('notification', notification);
    this.logger.log(`Notification sent to user: ${userId}`);
  }

  /**
   * Send notification to a specific email
   */
  sendToEmail(email: string, notification: any) {
    this.server.to(`email:${email}`).emit('notification', notification);
    this.logger.log(`Notification sent to email: ${email}`);
  }

  /**
   * Send notification to multiple users
   */
  sendToUsers(userIds: string[], notification: any) {
    userIds.forEach((userId) => {
      this.server.to(`user:${userId}`).emit('notification', notification);
    });
    this.logger.log(`Notification sent to ${userIds.length} users`);
  }

  /**
   * Broadcast notification to all connected clients
   */
  broadcast(notification: any) {
    this.server.emit('notification', notification);
    this.logger.log('Notification broadcasted to all clients');
  }

  /**
   * Get count of connected clients
   */
  getConnectedClientsCount(): number {
    return this.connectedClients.size;
  }

  private extractTokenFromSocket(client: Socket): string | null {
    // Try to get token from handshake auth
    const token = client.handshake.auth?.token || client.handshake.headers?.authorization;

    if (typeof token === 'string') {
      // Remove "Bearer " prefix if present
      return token.startsWith('Bearer ') ? token.substring(7) : token;
    }

    return null;
  }

  private async authenticateSocket(token: string): Promise<{
    userId?: string;
    email?: string;
  } | null> {
    try {
      const decoded = this.jwtService.verify(token, {
        algorithms: ['RS256'],
        publicKey: jwtConstants.publicKey,
      });

      const authUser = decoded?.verified_credentials?.find(
        (item: { address: any }) => item.address,
      );

      const user = await this.userService.createOrUpdate({
        email: decoded?.email,
        walletAddress: authUser?.address,
      });

      return {
        userId: user._id?.toString(),
        email: user.email,
      };
    } catch (error) {
      this.logger.error('Socket authentication error:', error);
      return null;
    }
  }
}
