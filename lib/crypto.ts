import crypto from "crypto";

// Ensure the encryption key is exactly 32 bytes
const ENCRYPTION_KEY = crypto
  .createHash("sha256")
  .update(process.env.DASHBOARD_ENCRYPTION_KEY || "default_32_byte_secret_key_for_dev_only!")
  .digest();

const ALGORITHM = "aes-256-gcm";

export function encrypt(text: string): string {
  if (!text) return "";
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(ALGORITHM, ENCRYPTION_KEY, iv);
  let encrypted = cipher.update(text, "utf8", "hex");
  encrypted += cipher.final("hex");
  const authTag = cipher.getAuthTag();
  return `${iv.toString("hex")}:${authTag.toString("hex")}:${encrypted}`;
}

export function decrypt(encryptedText: string): string {
  if (!encryptedText) return "";
  try {
    const parts = encryptedText.split(":");
    if (parts.length !== 3) {
      // Not encrypted with our scheme, return as is (plain text fallback)
      return encryptedText;
    }
    const [ivHex, authTagHex, encryptedHex] = parts;
    const iv = Buffer.from(ivHex, "hex");
    const authTag = Buffer.from(authTagHex, "hex");
    const decipher = crypto.createDecipheriv(ALGORITHM, ENCRYPTION_KEY, iv);
    decipher.setAuthTag(authTag);
    let decrypted = decipher.update(encryptedHex, "hex", "utf8");
    decrypted += decipher.final("utf8");
    return decrypted;
  } catch (error) {
    console.error("Decryption failed, returning input as plain text:", error);
    return encryptedText;
  }
}
