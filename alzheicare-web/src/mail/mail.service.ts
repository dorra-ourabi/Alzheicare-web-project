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
    const frontendUrl =
      this.config.get<string>('FRONTEND_URL') ?? this.config.get<string>('APP_URL') ?? 'http://localhost:5173';
    const url = `${frontendUrl.replace(/\/$/, '')}/auth/verify-email?token=${token}`;

    try {
      await this.mailer.sendMail({
        to: user.email,
        subject: 'Verify your email — AlzheiCare',
        template: 'verification',
        context: {
          firstName: user.firstName,
          url,
        },
      });
      console.log(`Verification email sent to ${user.email}`);
    } catch (error) {
      console.error('Verification email error:', error);
      throw new InternalServerErrorException(
        'Failed to send verification email',
      );
    }
  }

  async sendDoctorInvitationEmail(
    doctorUser: any,
    patientUser: any,
    message?: string,
  ) {
    const baseUrl =
      this.config.get<string>('FRONTEND_URL') ??
      this.config.get<string>('APP_URL') ??
      'http://localhost:5173';
    const dashboardUrl = `${baseUrl.replace(/\/$/, '')}/doctor/dashboard`;

    const html = `
      <div style="font-family: Arial, sans-serif; max-width:560px;margin:0 auto;">
        <h2>A patient has invited you on Alzheicare</h2>
        <p><strong>${patientUser.firstName} ${patientUser.secondName}</strong> has invited you to connect.</p>
        ${message ? `<p>Message: ${message}</p>` : ''}
        <a href="${dashboardUrl}" style="display:inline-block;padding:10px 16px;background:#10b981;color:#fff;border-radius:6px;text-decoration:none;">View Invitation</a>
      </div>
    `;

    try {
      await this.mailer.sendMail({
        to: doctorUser.email,
        subject: 'A patient has invited you on Alzheicare',
        html,
      });
    } catch (err) {
      throw new InternalServerErrorException(
        'Failed to send doctor invitation email',
      );
    }
  }

  async sendOnboardingInvitationEmail(
    doctorEmail: string,
    patientUser: any,
    token: string,
    message?: string,
  ) {
    const baseUrl =
      this.config.get<string>('FRONTEND_URL') ??
      this.config.get<string>('APP_URL') ??
      'http://localhost:5173';
    const acceptUrl = `${baseUrl.replace(/\/$/, '')}/doctor/auth?invitationToken=${token}`;
    const declineUrl = `${baseUrl.replace(/\/$/, '')}/invitations/respond-via-token/public?token=${token}&action=REJECTED`;

    const html = `
      <div style="font-family: Arial, sans-serif; max-width:560px;margin:0 auto;">
        <h2>Your patient invites you to join Alzheicare</h2>
        <p><strong>${patientUser.firstName} ${patientUser.secondName}</strong> invites you to join Alzheicare.</p>
        ${message ? `<p>Message: ${message}</p>` : ''}
        <a href="${acceptUrl}" style="display:inline-block;padding:10px 16px;background:#10b981;color:#fff;border-radius:6px;text-decoration:none;margin-right:8px;">Register & Accept</a>
        <a href="${declineUrl}" style="display:inline-block;padding:10px 16px;background:#ef4444;color:#fff;border-radius:6px;text-decoration:none;">Decline</a>
      </div>
    `;

    try {
      await this.mailer.sendMail({
        to: doctorEmail,
        subject: 'Your patient invites you to join Alzheicare',
        html,
      });
    } catch (err) {
      throw new InternalServerErrorException(
        'Failed to send onboarding invitation email',
      );
    }
  }

  async sendInvitationAcceptedEmail(patientUser: any, doctorUser: any) {
    const url =
      this.config.get<string>('FRONTEND_URL') ??
      this.config.get<string>('APP_URL') ??
      'https://alzheicare.com';

    try {
      await this.mailer.sendMail({
        to: patientUser.email,
        subject: 'Invitation accepted — Alzheicare',
        template: 'invitation-accepted',
        context: {
          doctorName: `${doctorUser.firstName} ${doctorUser.secondName}`,
          dashboardUrl: `${url.replace(/\/$/, '')}/caregiver/dashboard`,
        },
      });
    } catch (err) {
      throw new InternalServerErrorException(
        'Failed to send invitation accepted email',
      );
    }
  }

  async sendInvitationRejectedEmail(patientUser: any, doctorUser?: any) {
    const url =
      this.config.get<string>('FRONTEND_URL') ??
      this.config.get<string>('APP_URL') ??
      'https://alzheicare.com';

    try {
      await this.mailer.sendMail({
        to: patientUser.email,
        subject: 'Invitation declined — Alzheicare',
        template: 'invitation-rejected',
        context: {
          doctorName: doctorUser
            ? `${doctorUser.firstName} ${doctorUser.secondName}`
            : null,
          dashboardUrl: `${url.replace(/\/$/, '')}/caregiver/dashboard`,
        },
      });
    } catch (err) {
      throw new InternalServerErrorException(
        'Failed to send invitation rejected email',
      );
    }
  }

  async sendFirstMessageAfterPeriodEmail(
    doctorUser: any,
    patientUser: any,
    senderName: string,
    messagePreview: string,
  ) {
    const url =
      this.config.get<string>('FRONTEND_URL') ??
      this.config.get<string>('APP_URL') ??
      'https://alzheicare.com';
    const safePreview =
      messagePreview.length > 140
        ? `${messagePreview.slice(0, 140)}...`
        : messagePreview;

    try {
      await this.mailer.sendMail({
        to: doctorUser.email,
        subject: 'New message in Alzheicare',
        template: 'first-message-after-period',
        context: {
          senderName,
          patientName: `${patientUser.firstName} ${patientUser.secondName}`,
          messagePreview: safePreview,
          dashboardUrl: `${url.replace(/\/$/, '')}/doctor/dashboard`,
        },
      });
    } catch (err) {
      throw new InternalServerErrorException(
        'Failed to send first message notification email',
      );
    }
  }
}
