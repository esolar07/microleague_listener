import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from 'src/prisma/prisma.service';
import { UserService } from 'src/modules/user/user.service';

@Injectable()
export class AdminGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly userService: UserService,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authorization = request.headers.authorization;

    if (!authorization) {
      throw new UnauthorizedException('Missing authorization header');
    }

    const token = authorization.split(' ')[1];
    if (!token) {
      throw new UnauthorizedException('Missing token');
    }

    try {
      const payload = this.jwtService.verify(token);
      const walletAddress = payload.address;

      if (!walletAddress) {
        throw new UnauthorizedException('Invalid token payload');
      }

      // Create or update user
      const user = await this.userService.createOrUpdate({ walletAddress });
      // Check if user is admin
      const admin = await this.prisma.$queryRaw`
        SELECT * FROM "admins" WHERE address = ${walletAddress} LIMIT 1
      `;

      if (!admin || (Array.isArray(admin) && admin.length === 0)) {
        throw new UnauthorizedException('User is not an admin');
      }

      request.user = user;
      return true;
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw new UnauthorizedException(`Admin authentication failed: ${error.message}`);
    }
  }
}
