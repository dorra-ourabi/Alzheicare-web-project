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
      throw new InternalServerErrorException('Failed to send verification email');
    }
  }

  async sendDoctorInvitationEmail(doctorUser: any, patientUser: any, message?: string) {
    const url = this.config.get<string>('APP_URL') ?? 'https://alzheicare.com';

    try {
      await this.mailer.sendMail({
        to: doctorUser.email,
        subject: 'A patient has invited you on AlzheiCare',
        template: 'doctor-invitation',
        context: {
          doctorName: doctorUser.firstName,
          patientName: `${patientUser.firstName} ${patientUser.secondName}`,
          message,
          dashboardUrl: `${url}/dashboard`,
        },
      });
    } catch (err) {
      throw new InternalServerErrorException('Failed to send doctor invitation email');
    }
  }

  async sendOnboardingInvitationEmail(doctorEmail: string, patientUser: any, token: string, message?: string) {
    const baseUrl = this.config.get<string>('APP_URL') ?? 'https://alzheicare.com';
    const acceptUrl = `${baseUrl}/register?role=doctor&invitationToken=${token}`;
    const declineUrl = `${baseUrl}/invitation/decline?token=${token}`;

    try {
      await this.mailer.sendMail({
        to: doctorEmail,
        subject: 'Your patient invites you to join AlzheiCare',
        template: 'onboarding-invitation',
        context: {
          patientName: `${patientUser.firstName} ${patientUser.secondName}`,
          message,
          acceptUrl,
          declineUrl,
        },
      });
    } catch (err) {
      throw new InternalServerErrorException('Failed to send onboarding invitation email');
    }
  }

  async sendInvitationAcceptedEmail(patientUser: any, doctorUser: any) {
    const url = this.config.get<string>('APP_URL') ?? 'https://alzheicare.com';

    try {
      await this.mailer.sendMail({
        to: patientUser.email,
        subject: 'Invitation accepted — AlzheiCare',
        template: 'invitation-accepted',
        context: {
          doctorName: `${doctorUser.firstName} ${doctorUser.secondName}`,
          dashboardUrl: `${url}/dashboard`,
        },
      });
    } catch (err) {
      throw new InternalServerErrorException('Failed to send invitation accepted email');
    }
  }

  async sendInvitationRejectedEmail(patientUser: any, doctorUser?: any) {
    const url = this.config.get<string>('APP_URL') ?? 'https://alzheicare.com';

    try {
      await this.mailer.sendMail({
        to: patientUser.email,
        subject: 'Invitation declined — AlzheiCare',
        template: 'invitation-rejected',
        context: {
          doctorName: doctorUser
            ? `${doctorUser.firstName} ${doctorUser.secondName}`
            : null,
          dashboardUrl: `${url}/dashboard`,
        },
      });
    } catch (err) {
      throw new InternalServerErrorException('Failed to send invitation rejected email');
    }
  }

  async sendFirstMessageAfterPeriodEmail(
    doctorUser: any,
    patientUser: any,
    senderName: string,
    messagePreview: string,
  ) {
    const url = this.config.get<string>('APP_URL') ?? 'https://alzheicare.com';
    const safePreview = messagePreview.length > 140
      ? `${messagePreview.slice(0, 140)}...`
      : messagePreview;

    try {
      await this.mailer.sendMail({
        to: doctorUser.email,
        subject: 'New message in AlzheiCare',
        template: 'first-message-after-period',
        context: {
          senderName,
          patientName: `${patientUser.firstName} ${patientUser.secondName}`,
          messagePreview: safePreview,
          dashboardUrl: `${url}/dashboard`,
        },
      });
    } catch (err) {
      throw new InternalServerErrorException('Failed to send first message notification email');
    }
  }
}