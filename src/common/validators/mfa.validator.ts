import { z } from "zod";

// Schema for verifying initial MFA setup
export const verifyMfaSchema = z.object({
  code: z.string().trim().min(1).max(6), // TOTP code from authenticator
  secretKey: z.string().trim().min(1), // Secret key for verification
});

// Schema for verifying MFA during login
export const verifyMfaForLoginSchema = z.object({
  code: z.string().trim().min(1).max(6), // TOTP code from authenticator
  email: z.string().trim().email().min(1), // User's email
  userAgent: z.string().optional(), // Optional browser/device info
});
