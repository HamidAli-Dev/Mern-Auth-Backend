import express from "express";

import { authenticateJWT } from "../../common/strategies/jwt.strategy";
import { mfaController } from "./mfa.module";

const mfaRoutes = express.Router();

mfaRoutes.get("/setup", authenticateJWT, mfaController.generateMFASetup);

// Route: Verify MFA setup
mfaRoutes.post("/verify", authenticateJWT, mfaController.verifyMFASetup);

// Route: Disable/revoke MFA for user
mfaRoutes.put("/revoke", authenticateJWT, mfaController.revokeMFA);

// Route: Verify MFA code during login
mfaRoutes.post("/verify-login", mfaController.verifyMFAForLogin);

export default mfaRoutes;
