import { Injectable } from '@nestjs/common';
import * as crypto from 'crypto';

@Injectable()
export class TwoFactorService {
  generateSecret(email: string): { secret: string; qrCode: string } {
    const secret = this.generateBase32Secret();
    const otpAuthUrl = `otpauth://totp/Dhanam:${email}?secret=${secret}&issuer=Dhanam`;
    
    // For now, return the URL - in production, use a QR code library
    return {
      secret,
      qrCode: otpAuthUrl, // This would be converted to QR code image
    };
  }

  verifyTotp(secret: string, token: string): boolean {
    const window = 2; // Allow 2 * 30s window
    const currentTime = Math.floor(Date.now() / 1000 / 30);
    
    for (let i = -window; i <= window; i++) {
      const time = currentTime + i;
      const expectedToken = this.generateTotp(secret, time);
      if (this.timingSafeEqual(token, expectedToken)) {
        return true;
      }
    }
    
    return false;
  }

  private generateTotp(secret: string, time: number): string {
    const buffer = Buffer.alloc(8);
    buffer.writeBigInt64BE(BigInt(time));
    
    const key = Buffer.from(this.base32Decode(secret), 'binary');
    const hmac = crypto.createHmac('sha1', key);
    hmac.update(buffer);
    const hash = hmac.digest();
    
    const offset = hash[hash.length - 1]! & 0xf;
    const binary = 
      ((hash[offset]! & 0x7f) << 24) |
      ((hash[offset + 1]! & 0xff) << 16) |
      ((hash[offset + 2]! & 0xff) << 8) |
      (hash[offset + 3]! & 0xff);
    
    const otp = binary % 1000000;
    return otp.toString().padStart(6, '0');
  }

  private generateBase32Secret(length: number = 32): string {
    const base32 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
    const buffer = crypto.randomBytes(length);
    let secret = '';
    
    for (let i = 0; i < buffer.length; i++) {
      secret += base32[buffer[i]! % 32];
    }
    
    return secret;
  }

  private base32Decode(encoded: string): string {
    const base32 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
    let bits = '';
    let value = '';
    
    for (const char of encoded.toUpperCase()) {
      const val = base32.indexOf(char);
      if (val === -1) continue;
      bits += val.toString(2).padStart(5, '0');
    }
    
    for (let i = 0; i + 8 <= bits.length; i += 8) {
      value += String.fromCharCode(parseInt(bits.substr(i, 8), 2));
    }
    
    return value;
  }

  private timingSafeEqual(a: string, b: string): boolean {
    if (a.length !== b.length) return false;
    
    const bufferA = Buffer.from(a);
    const bufferB = Buffer.from(b);
    
    return crypto.timingSafeEqual(bufferA, bufferB);
  }
}