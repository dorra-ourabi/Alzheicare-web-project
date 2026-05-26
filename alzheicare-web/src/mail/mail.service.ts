import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class MailService {
  constructor(
    private readonly mailer: MailerService,
    private readonly config: ConfigService,
  ) {}

  async sendVerificationEmail(user: any, token: string): Promise<void> {
    const baseUrl = this.config.get<string>('APP_URL') ?? 'http://localhost:3000';
    const url = `${baseUrl}/auth/verify-email?token=${token}`;

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; background: #f4f4f4; margin: 0; padding: 0; }
            .container { max-width: 560px; margin: 40px auto; background: #fff; border-radius: 8px; padding: 40px; }
            .logo { font-size: 24px; font-weight: bold; color: #4F46E5; margin-bottom: 24px; }
            .btn { display: inline-block; padding: 14px 28px; background: #4F46E5; color: #fff; text-decoration: none; border-radius: 6px; font-weight: bold; margin: 24px 0; }
            .footer { margin-top: 32px; font-size: 12px; color: #999; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="logo">AlzheiCare</div>
            <h2>Hello, ${user.firstName}!</h2>
            <p>Thank you for registering. Please verify your email to activate your account.</p>
            <a href="${url}" class="btn">Verify my Email</a>
            <p>This link expires in <strong>24 hours</strong>.</p>
            <p>If you didn't create an account, you can safely ignore this email.</p>
            <div class="footer">&copy; 2026 AlzheiCare. All rights reserved.</div>
          </div>
        </body>
      </html>
    `;

    try {
      await this.mailer.sendMail({
        to: user.email,
        subject: 'Verify your email — AlzheiCare',
        html,
      });
      console.log(`Verification email sent to ${user.email}`);
    } catch (error) {
      throw new InternalServerErrorException('Failed to send verification email');
    }
  }

  async sendDoctorInvitationEmail(doctorUser: any, patientUser: any, message?: string) {
    const url = this.config.get<string>('APP_URL') ?? 'https://alzheicare.com';
    const html = `
      <div style="font-family: Arial, sans-serif;">
        <h2>A patient has invited you on AlzheiCare</h2>
        <p><strong>${patientUser.firstName} ${patientUser.secondName}</strong> has invited you to connect.</p>
        ${message ? `<p>Message: ${message}</p>` : ''}
        <a href="${url}/dashboard" style="display:inline-block;padding:10px 16px;background:#10b981;color:#fff;border-radius:6px;text-decoration:none;">Open dashboard</a>
      </div>
    `;

    try {
      await this.mailer.sendMail({ to: doctorUser.email, subject: 'A patient has invited you on AlzheiCare', html });
    } catch (err) {
      throw new InternalServerErrorException('Failed to send doctor invitation email');
    }
  }

  async sendOnboardingInvitationEmail(doctorEmail: string, patientUser: any, token: string, message?: string) {
    const baseUrl = this.config.get<string>('APP_URL') ?? 'https://alzheicare.com';
    const acceptUrl = `${baseUrl}/register?role=doctor&invitationToken=${token}`;
    const declineUrl = `${baseUrl}/invitation/decline?token=${token}`;
    const html = `
      <div style="font-family: Arial, sans-serif;">
        <h2>Your patient invites you to join AlzheiCare</h2>
        <p><strong>${patientUser.firstName} ${patientUser.secondName}</strong> invites you to join AlzheiCare.</p>
        ${message ? `<p>Message: ${message}</p>` : ''}
        <a href="${acceptUrl}" style="display:inline-block;padding:10px 16px;background:#10b981;color:#fff;border-radius:6px;text-decoration:none;margin-right:8px;">Register & Accept</a>
        <a href="${declineUrl}" style="display:inline-block;padding:10px 16px;background:#ef4444;color:#fff;border-radius:6px;text-decoration:none;">Decline</a>
      </div>
    `;

    try {
      await this.mailer.sendMail({ to: doctorEmail, subject: 'Your patient invites you to join AlzheiCare', html });
    } catch (err) {
      throw new InternalServerErrorException('Failed to send onboarding invitation email');
    }
  }

  async sendInvitationAcceptedEmail(patientUser: any, doctorUser: any) {
    const url = this.config.get<string>('APP_URL') ?? 'https://alzheicare.com';
    const html = `
      <div style="font-family: Arial, sans-serif;">
        <h2>Your invitation was accepted</h2>
        <p><strong>${doctorUser.firstName} ${doctorUser.secondName}</strong> accepted your invitation and is now connected with you.</p>
        <a href="${url}/dashboard" style="display:inline-block;padding:10px 16px;background:#10b981;color:#fff;border-radius:6px;text-decoration:none;">Go to dashboard</a>
      </div>
    `;

    try {
      await this.mailer.sendMail({ to: patientUser.email, subject: 'Invitation accepted — AlzheiCare', html });
    } catch (err) {
      throw new InternalServerErrorException('Failed to send invitation accepted email');
    }
  }

  async sendInvitationRejectedEmail(patientUser: any, doctorUser?: any) {
    const url = this.config.get<string>('APP_URL') ?? 'https://alzheicare.com';
    const html = `
      <div style="font-family: Arial, sans-serif;">
        <h2>Your invitation was declined</h2>
        <p>Your invitation was declined.${doctorUser ? ` Doctor: ${doctorUser.firstName} ${doctorUser.secondName}` : ''}</p>
        <a href="${url}/dashboard" style="display:inline-block;padding:10px 16px;background:#6b7280;color:#fff;border-radius:6px;text-decoration:none;">Go to dashboard</a>
      </div>
    `;

    try {
      await this.mailer.sendMail({ to: patientUser.email, subject: 'Invitation declined — AlzheiCare', html });
    } catch (err) {
      throw new InternalServerErrorException('Failed to send invitation rejected email');
    }
  }
}