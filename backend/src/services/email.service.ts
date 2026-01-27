import { resend } from '../config/resend';

export const sendEmail = async ({
  to,
  subject,
  html,
}: {
  to: string;
  subject: string;
  html: string;
}) => {
  try {
    const data = await resend.emails.send({
      from: 'onboarding@resend.dev',
      to,
      subject,
      html,
    });
    return data;
  } catch (error) {
    console.error('Error sending email:', error);
    throw error;
  }
};
