const crypto = require('crypto');
const oldKey = '01234567890123456789012345678901';
const newKey = 'egiistw8800000000000000000000000';
const IV_LENGTH = 16;
const iv = crypto.randomBytes(IV_LENGTH);

const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(oldKey), iv);
let encrypted = cipher.update('Test Conversation');
encrypted = Buffer.concat([encrypted, cipher.final()]);
const encText = iv.toString('hex') + ':' + encrypted.toString('hex');

console.log("Encrypted with old key:", encText);

try {
  const textParts = encText.split(':');
  const iv2 = Buffer.from(textParts.shift(), 'hex');
  const encryptedText = Buffer.from(textParts.join(':'), 'hex');
  const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(newKey), iv2);
  let decrypted = decipher.update(encryptedText);
  decrypted = Buffer.concat([decrypted, decipher.final()]);
  console.log("Decrypted with new key:", decrypted.toString());
} catch(e) {
  console.log("Decryption error:", e.message);
}
