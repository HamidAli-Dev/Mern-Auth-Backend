import nodemailer, { Transporter } from "nodemailer";
import { config } from "../config/app.config";

// Production configuration
const transporter: Transporter = nodemailer.createTransport({
  host: config.SMTP_HOST,
  port: 465 | 587,
  service: config.SMTP_SERVICE,
  secure: config.NODE_ENV === "production",
  auth: {
    user: config.SMTP_MAIL,
    pass: config.SMTP_PASSWORD,
  },
});

export { transporter };
