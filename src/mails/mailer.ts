import { config } from "../config/app.config";
import { transporter } from "./nodeMailerClient";

type SendEmailResponse = {
  data: { id: string } | null;
  error: Error | null;
};

type SendEmailParams = {
  to: string | string[];
  subject: string;
  text: string;
  html: string;
  from?: string;
};
export const sendEmail = async ({
  to,
  subject,
  text,
  html,
  from = `no-reply <${config.SMTP_MAIL}>`,
}: SendEmailParams): Promise<SendEmailResponse> => {
  try {
    const info = await transporter.sendMail({
      from,
      to: Array.isArray(to) ? to.join(",") : to,
      subject,
      text,
      html,
    });

    return {
      data: { id: info.messageId },
      error: null,
    };
  } catch (error) {
    return {
      data: null,
      error: error as Error,
    };
  }
};
