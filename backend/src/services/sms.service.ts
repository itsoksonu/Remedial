import { twilioClient } from '../config/twilio';
import { env } from '../config/env';

export const sendSms = async ({ to, body }: { to: string; body: string }) => {
  try {
    const message = await twilioClient.messages.create({
      body,
      from: env.TWILIO_PHONE_NUMBER,
      to,
    });
    return message;
  } catch (error) {
    console.error('Error sending SMS:', error);
    throw error;
  }
};
