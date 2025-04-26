import { Request } from "express";
import speakeasy from "speakeasy";
import qrcode from "qrcode";

import {
  BadRequestException,
  NotFoundException,
  UnauthorizedException,
} from "../../common/utils/catch-errors";
import SessionModel from "../../database/models/session.model";
import { refreshTokenSignOptions, signJwtToken } from "../../common/utils/jwt";
import UserModel from "../../database/models/user.model";

export class MfaService {
  public async generateMFASetup(req: Request) {
    // Extract user from request (set by JWT middleware)
    const user = req.user;

    // Verify user is authenticated
    if (!user) {
      throw new UnauthorizedException("User not authorized");
    }

    // Check if MFA is already enabled for the user
    if (user.userPreferences.enable2FA) {
      return {
        message: "MFA already enabled",
      };
    }

    // Get existing secret or generate new one
    let secretKey = user.userPreferences.twoFactorSecret;
    if (!secretKey) {
      // Generate new secret using speakeasy
      const secret = speakeasy.generateSecret({ name: "Squeezy" });
      secretKey = secret.base32;
      // Save secret to user preferences
      user.userPreferences.twoFactorSecret = secretKey;
      await user.save();
    }

    // Generate otpauth URL for QR code
    const url = speakeasy.otpauthURL({
      secret: secretKey,
      label: `${user.name}`,
      issuer: "hamiddev.com",
      encoding: "base32",
    });

    // Convert otpauth URL to QR code data URL
    const qrImageUrl = await qrcode.toDataURL(url);

    // Return setup information
    return {
      message: "Scan the QR code or use the setup key.",
      secret: secretKey,
      qrImageUrl,
    };
  }

  public async verifyMFASetup(req: Request, code: string, secretKey: string) {
    // Extract user from request (set by JWT middleware)
    const user = req.user;

    if (!user) {
      throw new UnauthorizedException("User not authorized");
    }

    // Check if MFA is already enabled for the user
    if (user.userPreferences.enable2FA) {
      return {
        message: "MFA is already enabled",
        userPreferences: {
          enable2FA: user.userPreferences.enable2FA,
        },
      };
    }

    // Verify the TOTP code against the secret key
    const isValid = speakeasy.totp.verify({
      secret: secretKey,
      encoding: "base32",
      token: code,
    });

    if (!isValid) {
      throw new BadRequestException("Invalid MFA code. Please try again.");
    }

    // Enable MFA for the user
    user.userPreferences.enable2FA = true;
    await user.save();

    // Return success message and updated user preferences
    return {
      message: "MFA setup completed successfully",
      userPreferences: {
        enable2FA: user.userPreferences.enable2FA,
      },
    };
  }

  public async revokeMFA(req: Request) {
    // Extract user from request (set by JWT middleware)
    const user = req.user;

    if (!user) {
      throw new UnauthorizedException("User not authorized");
    }

    // check if MFA is not enabled for the user
    if (!user.userPreferences.enable2FA) {
      return {
        message: "MFA is not enabled",
        userPreferences: {
          enable2FA: user.userPreferences.enable2FA,
        },
      };
    }

    // Revoke MFA for the user
    user.userPreferences.twoFactorSecret = undefined;
    user.userPreferences.enable2FA = false;
    await user.save();

    // Return success message and updated user preferences
    return {
      message: "MFA revoke successfully",
      userPreferences: {
        enable2FA: user.userPreferences.enable2FA,
      },
    };
  }


  public async verifyMFAForLogin(
    code: string,
    email: string,
    userAgent?: string
  ) {
    const user = await UserModel.findOne({ email });

    if (!user) {
      throw new NotFoundException("User not found");
    }

    // check if MFA is not enabled for the user
    if (
      !user.userPreferences.enable2FA &&
      !user.userPreferences.twoFactorSecret
    ) {
      throw new UnauthorizedException("MFA not enabled for this user");
    }

    // isValid is a boolean that checks if the TOTP code is valid
    const isValid = speakeasy.totp.verify({
      secret: user.userPreferences.twoFactorSecret!,
      encoding: "base32",
      token: code,
    });

    if (!isValid) {
      throw new BadRequestException("Invalid MFA code. Please try again.");
    }

    //sign access token & refresh token
    const session = await SessionModel.create({
      userId: user._id,
      userAgent,
    });

    const accessToken = signJwtToken({
      userId: user._id,
      sessionId: session._id,
    });

    const refreshToken = signJwtToken(
      {
        sessionId: session._id,
      },
      refreshTokenSignOptions
    );

    return {
      user,
      accessToken,
      refreshToken,
    };
  }
}
