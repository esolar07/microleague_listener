import { Injectable, Logger } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { ethers } from "ethers";
import { UserService } from "../user/user.service";
import * as crypto from "crypto";

interface StoredNonce {
  nonce: string;
  createdAt: number;
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  /** In-memory nonce store keyed by lowercase wallet address. */
  private readonly nonces = new Map<string, StoredNonce>();
  private readonly NONCE_TTL_MS = 5 * 60 * 1000; // 5 minutes

  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
  ) {}

  async generateNonce(walletAddress: string): Promise<{ nonce: string; message: string }> {
    const address = walletAddress.trim().toLowerCase();
    const nonce = crypto.randomBytes(32).toString("hex");

    // Store in memory
    this.nonces.set(address, { nonce, createdAt: Date.now() });

    // Clean up expired nonces periodically
    this.cleanExpiredNonces();

    const message = [
      "Welcome to MicroLeague Presale Admin!",
      "",
      "Please sign this message to verify your wallet ownership.",
      "",
      `Wallet: ${address}`,
      `Nonce: ${nonce}`,
    ].join("\n");

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
      throw new Error("Signature does not match the provided wallet address");
    }

    const stored = this.nonces.get(address);
    if (!stored) {
      throw new Error("No nonce found for this wallet. Request a new nonce first.");
    }

    if (Date.now() - stored.createdAt > this.NONCE_TTL_MS) {
      this.nonces.delete(address);
      throw new Error("Nonce has expired. Request a new nonce.");
    }

    if (!message.includes(stored.nonce)) {
      throw new Error("Invalid nonce in signed message");
    }

    // Consume the nonce (one-time use)
    this.nonces.delete(address);

    const user = await this.userService.createOrUpdate({ walletAddress: address });

    const payload = { sub: user.id, address };
    const token = this.jwtService.sign(payload);

    return { token, address };
  }

  verifyToken(token: string): { sub: string; address: string } {
    return this.jwtService.verify(token);
  }

  private cleanExpiredNonces() {
    const now = Date.now();
    for (const [addr, data] of this.nonces) {
      if (now - data.createdAt > this.NONCE_TTL_MS) {
        this.nonces.delete(addr);
      }
    }
  }
}
