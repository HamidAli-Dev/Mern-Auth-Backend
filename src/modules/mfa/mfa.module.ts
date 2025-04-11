import { MfaController } from "./mfa.controller";
import { MfaService } from "./mfa.service";

const mfaService = new MfaService();
const mfaController = new MfaController(mfaService);

// Export instances for use in routes and other modules
export { mfaService, mfaController };
