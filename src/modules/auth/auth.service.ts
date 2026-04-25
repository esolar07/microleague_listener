import { Injectable, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ethers } from 'ethers';
import { UserService } from '../user/user.service';
import { PrismaService } from 'src/prisma/prisma.service';
import * as crypto from 'crypto';

const NONCE_TTL_MS = 5 * 60 * 1000; // 5 minutes

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
  ) {}

  async generateNonce(walletAddress: string): Promise<{ nonce: string; message: string }> {
    const address = walletAddress.trim().toLowerCase();
    const nonce = crypto.randomBytes(32).toString('hex');

    // Persist nonce to DB so it survives service restarts.
    // Replace any existing nonce for this wallet (upsert by walletAddress unique key).
    const existing = await this.prisma.authNonce.findUnique({ where: { walletAddress: address } });
    if (existing) {
      await this.prisma.authNonce.update({
        where: { walletAddress: address },
        data: { nonce, createdAt: new Date() },
      });
    } else {
      await this.prisma.authNonce.create({
        data: { walletAddress: address, nonce },
      });
    }

    const message = [
      'Welcome to MicroLeague Presale Admin!',
      '',
      'Please sign this message to verify your wallet ownership.',
      '',
      `Wallet: ${address}`,
      `Nonce: ${nonce}`,
    ].join('\n');

    return { nonce, message };
  }

  async verifySignature(
    walletAddress: string,
    signature: string,
    message: string,
  ): Promise<{ token: string; address: string }> {
    const address = walletAddress.trim().toLowerCase();

    const recoveredAddress = ethers.verifyMessage(message, signature).toLowerCase();
    if (recoveredAddress !== address) {
      throw new Error('Signature does not match the provided wallet address');
    }

    const stored = await this.prisma.authNonce.findUnique({ where: { walletAddress: address } });
    if (!stored) {
      throw new Error('No nonce found for this wallet. Request a new nonce first.');
    }

    if (Date.now() - stored.createdAt.getTime() > NONCE_TTL_MS) {
      await this.prisma.authNonce.delete({ where: { walletAddress: address } });
      throw new Error('Nonce has expired. Request a new nonce.');
    }

    if (!message.includes(stored.nonce)) {
      throw new Error('Invalid nonce in signed message');
    }

    // Consume the nonce (one-time use)
    await this.prisma.authNonce.delete({ where: { walletAddress: address } });

    const user = await this.userService.createOrUpdate({ walletAddress: address });

    const payload = { sub: user.id, address };
    const token = this.jwtService.sign(payload);

    return { token, address };
  }

  verifyToken(token: string): { sub: string; address: string } {
    return this.jwtService.verify(token);
  }
}
