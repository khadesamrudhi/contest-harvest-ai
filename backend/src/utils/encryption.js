// src/utils/encryption.js

const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

class Encryption {
  constructor() {
    this.algorithm = 'aes-256-gcm';
    this.key = process.env.ENCRYPTION_KEY || crypto.randomBytes(32);
    this.jwtSecret = process.env.JWT_SECRET || 'hackathon-secret-key';
  }

  // Basic AES encryption
  encrypt(text) {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipher(this.algorithm, this.key, iv);
    
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const authTag = cipher.getAuthTag();
    
    return {
      iv: iv.toString('hex'),
      authTag: authTag.toString('hex'),
      data: encrypted
    };
  }

  // Basic AES decryption
  decrypt(encryptedObj) {
    const decipher = crypto.createDecipher(
      this.algorithm, 
      this.key, 
      Buffer.from(encryptedObj.iv, 'hex')
    );
    
    decipher.setAuthTag(Buffer.from(encryptedObj.authTag, 'hex'));
    
    let decrypted = decipher.update(encryptedObj.data, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  }

  // Hash password
  async hashPassword(password) {
    return await bcrypt.hash(password, 10);
  }

  // Verify password
  async verifyPassword(password, hash) {
    return await bcrypt.compare(password, hash);
  }

  // Generate JWT
  generateJWT(payload, expiresIn = '24h') {
    return jwt.sign(payload, this.jwtSecret, { expiresIn });
  }

  // Verify JWT
  verifyJWT(token) {
    try {
      return jwt.verify(token, this.jwtSecret);
    } catch (error) {
      throw new Error('Invalid token');
    }
  }

  // Generate random string
  generateRandom(length = 32) {
    return crypto.randomBytes(length).toString('hex');
  }

  // Generate OTP
  generateOTP(length = 6) {
    let otp = '';
    for (let i = 0; i < length; i++) {
      otp += Math.floor(Math.random() * 10);
    }
    return otp;
  }

  // Simple hash
  hash(data) {
    return crypto.createHash('sha256').update(data).digest('hex');
  }

  // Generate API key
  generateAPIKey() {
    return 'ch_' + this.generateRandom(16);
  }
}

module.exports = new Encryption();