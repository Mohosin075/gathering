import { Resend } from 'resend'
import { StatusCodes } from 'http-status-codes'
import config from '../../../config'
import ApiError from '../../../errors/ApiError'
import { EmailNotificationData } from './notification.interface'
import { EmailTemplates } from './notification.templates'

export class EmailProvider {
  private resend: Resend
  private static instance: EmailProvider

  private constructor() {
    this.resend = new Resend(config.email.resend_api_key)
  }

  static getInstance(): EmailProvider {
    if (!EmailProvider.instance) {
      EmailProvider.instance = new EmailProvider()
    }
    return EmailProvider.instance
  }

  async sendEmail(data: EmailNotificationData): Promise<boolean> {
    try {
      const { subject, html } = EmailTemplates.getTemplate(
        data.template,
        data.data,
      )

      const to = Array.isArray(data.to) ? data.to : [data.to]

      const { data: result, error } = await this.resend.emails.send({
        from: `gathering <${config.email.from}>`,
        to,
        subject,
        html,
      })

      if (error) {
        console.error('❌ Resend email error:', error)
        throw new ApiError(
          StatusCodes.INTERNAL_SERVER_ERROR,
          `Failed to send email: ${error.message}`,
        )
      }

      console.log(`📧 Email sent: ${result?.id}`)
      console.log(`   To: ${to.join(', ')}`)
      console.log(`   Subject: ${subject}`)

      return true
    } catch (error: any) {
      console.error('❌ Email sending failed:', error.message)
      throw new ApiError(
        StatusCodes.INTERNAL_SERVER_ERROR,
        `Failed to send email: ${error.message}`,
      )
    }
  }

  async sendBulkEmails(
    emails: EmailNotificationData[],
  ): Promise<{ success: number; failed: number }> {
    const results = {
      success: 0,
      failed: 0,
    }

    for (const emailData of emails) {
      try {
        await this.sendEmail(emailData)
        results.success++
      } catch (error) {
        console.error(`Failed to send email to: ${emailData.to}`)
        results.failed++
      }
    }

    console.log(
      `📧 Bulk email sending completed: ${results.success} succeeded, ${results.failed} failed`,
    )
    return results
  }

  async sendTemplateEmail(
    to: string | string[],
    template: string,
    templateData: Record<string, any>,
    subjectOverride?: string,
  ): Promise<boolean> {
    const data: EmailNotificationData = {
      to,
      subject: subjectOverride || '',
      template,
      data: templateData,
    }

    return this.sendEmail(data)
  }

  async sendWelcomeEmail(to: string, userName: string): Promise<boolean> {
    return this.sendTemplateEmail(to, 'welcome', {
      userName,
      actionUrl: `${config.clientUrl}/dashboard`,
      actionText: 'Go to Dashboard',
    })
  }

  async sendEventReminder(to: string, eventData: any): Promise<boolean> {
    return this.sendTemplateEmail(to, 'event-reminder', {
      ...eventData,
      actionUrl: `${config.clientUrl}/events/${eventData.eventId}`,
      actionText: 'View Event Details',
    })
  }

  async sendPasswordReset(
    to: string,
    resetCode: string,
    userName: string,
  ): Promise<boolean> {
    return this.sendTemplateEmail(to, 'password-reset', {
      userName,
      resetCode,
      expiryMinutes: 30,
      actionUrl: `${config.clientUrl}/reset-password?code=${resetCode}`,
      actionText: 'Reset Password',
    })
  }

  async sendAccountVerification(
    to: string,
    userName: string,
    verificationToken: string,
  ): Promise<boolean> {
    const verificationUrl = `${config.clientUrl}/verify-email?token=${verificationToken}`

    return this.sendTemplateEmail(to, 'account-verification', {
      userName,
      verificationUrl,
      actionUrl: verificationUrl,
      actionText: 'Verify Account',
    })
  }
}

export const emailProvider = EmailProvider.getInstance()
