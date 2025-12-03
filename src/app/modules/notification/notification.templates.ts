import { NOTIFICATION_TEMPLATES } from './notification.constant'

export interface TemplateData {
  [key: string]: any
}

export class EmailTemplates {
  private static baseStyles = `
    <style>
      * { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif; }
      body { margin: 0; padding: 0; background-color: #f7f7f7; }
      .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; }
      .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 20px; text-align: center; }
      .content { padding: 40px 30px; color: #333333; line-height: 1.6; }
      .footer { padding: 20px; text-align: center; color: #666666; font-size: 12px; border-top: 1px solid #eeeeee; }
      .button { display: inline-block; padding: 12px 30px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; text-decoration: none; border-radius: 6px; font-weight: 500; margin: 20px 0; }
      .event-details { background: #f8f9fa; border-radius: 8px; padding: 20px; margin: 20px 0; }
      .info-row { display: flex; justify-content: space-between; margin-bottom: 10px; }
      .info-label { font-weight: 600; color: #555; }
      .info-value { color: #333; }
      .ticket-qr { text-align: center; margin: 20px 0; }
      .qr-code { max-width: 200px; height: auto; }
    </style>
  `

  private static header = (title: string) => `
    <div class="header">
      <h1 style="color: white; margin: 0; font-size: 28px; font-weight: 700;">${title}</h1>
    </div>
  `

  private static footer = `
    <div class="footer">
      <p>© ${new Date().getFullYear()} EventHub. All rights reserved.</p>
      <p>This email was sent by EventHub. If you have any questions, contact us at support@eventhub.com</p>
      <p>
        <a href="{{unsubscribeLink}}" style="color: #667eea; text-decoration: none;">Unsubscribe</a> | 
        <a href="{{privacyLink}}" style="color: #667eea; text-decoration: none;">Privacy Policy</a> | 
        <a href="{{termsLink}}" style="color: #667eea; text-decoration: none;">Terms of Service</a>
      </p>
    </div>
  `

  static getTemplate(
    templateName: string,
    data: TemplateData,
  ): { subject: string; html: string } {
    const template = this.templates[templateName]
    if (!template) {
      throw new Error(`Template ${templateName} not found`)
    }

    let html = this.baseStyles
    html += `<div class="container">`
    html += this.header(template.getTitle(data))
    html += `<div class="content">`
    html += template.getBody(data)
    if (data.actionUrl && data.actionText) {
      html += `<div style="text-align: center; margin-top: 30px;">
                <a href="${data.actionUrl}" class="button">${data.actionText}</a>
              </div>`
    }
    html += `</div>`
    html += this.footer
    html += `</div>`

    return {
      subject: template.getSubject(data),
      html: this.replacePlaceholders(html, data),
    }
  }

  private static replacePlaceholders(html: string, data: TemplateData): string {
    return html.replace(/\{\{(\w+)\}\}/g, (match, key) => {
      return data[key] !== undefined ? data[key] : match
    })
  }

  private static templates = {
    // Welcome Email
    [NOTIFICATION_TEMPLATES.WELCOME]: {
      getTitle: (data: TemplateData) =>
        `Welcome to EventHub, ${data.userName}!`,
      getSubject: (data: TemplateData) => `Welcome to EventHub!`,
      getBody: (data: TemplateData) => `
        <h2>Welcome aboard, ${data.userName}!</h2>
        <p>We're excited to have you join our community of event enthusiasts. Here's what you can do:</p>
        <ul>
          <li>Discover amazing events in your area</li>
          <li>Create and manage your own events</li>
          <li>Connect with like-minded people</li>
          <li>Get personalized event recommendations</li>
        </ul>
        <p>Start exploring now and find events that match your interests!</p>
      `,
    },

    // Ticket Confirmation
    [NOTIFICATION_TEMPLATES.TICKET_CONFIRMATION]: {
      getTitle: (data: TemplateData) => `Ticket Confirmed!`,
      getSubject: (data: TemplateData) =>
        `Ticket Confirmation - ${data.eventTitle}`,
      getBody: (data: TemplateData) => `
        <h2>🎉 Your Ticket is Confirmed!</h2>
        <p>Thank you for your purchase. Your ticket for <strong>${data.eventTitle}</strong> has been confirmed.</p>
        
        <div class="event-details">
          <div class="info-row">
            <span class="info-label">Event:</span>
            <span class="info-value">${data.eventTitle}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Date & Time:</span>
            <span class="info-value">${data.eventDate} at ${data.eventTime}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Location:</span>
            <span class="info-value">${data.eventLocation}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Ticket Type:</span>
            <span class="info-value">${data.ticketType}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Quantity:</span>
            <span class="info-value">${data.quantity}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Order ID:</span>
            <span class="info-value">${data.orderId}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Total Paid:</span>
            <span class="info-value">${data.amount} ${data.currency}</span>
          </div>
        </div>

        <div class="ticket-qr">
          <p><strong>Your Ticket QR Code:</strong></p>
          <img src="${data.qrCodeUrl}" alt="Ticket QR Code" class="qr-code" />
          <p style="font-size: 12px; color: #666;">Show this QR code at the event entrance</p>
        </div>

        <p><strong>Important Information:</strong></p>
        <ul>
          <li>Please arrive at least 30 minutes before the event starts</li>
          <li>Bring a valid ID that matches the ticket name</li>
          <li>Keep this email accessible for check-in</li>
          <li>Contact support if you have any questions</li>
        </ul>
      `,
    },

    // Event Reminder
    [NOTIFICATION_TEMPLATES.EVENT_REMINDER]: {
      getTitle: (data: TemplateData) => `Event Reminder: ${data.eventTitle}`,
      getSubject: (data: TemplateData) =>
        `Reminder: ${data.eventTitle} starts ${data.timeUntilEvent}`,
      getBody: (data: TemplateData) => `
        <h2>⏰ Event Reminder</h2>
        <p>Don't forget about <strong>${data.eventTitle}</strong>!</p>
        
        <div class="event-details">
          <div class="info-row">
            <span class="info-label">Event Starts:</span>
            <span class="info-value">${data.eventStart}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Location:</span>
            <span class="info-value">${data.eventLocation}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Duration:</span>
            <span class="info-value">${data.eventDuration}</span>
          </div>
        </div>

        <p><strong>What to bring:</strong></p>
        <ul>
          <li>Your ticket QR code (from confirmation email)</li>
          <li>Valid photo ID</li>
          ${data.specialRequirements ? `<li>${data.specialRequirements}</li>` : ''}
        </ul>

        <p><strong>Getting there:</strong></p>
        <p>${data.locationInstructions || 'Please check the event page for directions.'}</p>

        <p>We look forward to seeing you there!</p>
      `,
    },

    // Payment Success
    [NOTIFICATION_TEMPLATES.PAYMENT_SUCCESS]: {
      getTitle: (data: TemplateData) => `Payment Successful!`,
      getSubject: (data: TemplateData) =>
        `Payment Successful - ${data.eventTitle}`,
      getBody: (data: TemplateData) => `
        <h2>✅ Payment Successful</h2>
        <p>Your payment for <strong>${data.eventTitle}</strong> has been processed successfully.</p>
        
        <div class="event-details">
          <div class="info-row">
            <span class="info-label">Transaction ID:</span>
            <span class="info-value">${data.transactionId}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Amount Paid:</span>
            <span class="info-value">${data.amount} ${data.currency}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Payment Method:</span>
            <span class="info-value">${data.paymentMethod}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Date:</span>
            <span class="info-value">${data.paymentDate}</span>
          </div>
        </div>

        <p>Your tickets have been confirmed and sent to your email. Check your inbox for the ticket confirmation email.</p>
        
        <p><strong>Need help?</strong></p>
        <p>If you have any questions about your purchase, please contact our support team.</p>
      `,
    },

    // Password Reset
    [NOTIFICATION_TEMPLATES.PASSWORD_RESET]: {
      getTitle: (data: TemplateData) => `Reset Your Password`,
      getSubject: (data: TemplateData) => `Password Reset Request`,
      getBody: (data: TemplateData) => `
        <h2>Reset Your Password</h2>
        <p>We received a request to reset your password for your EventHub account.</p>
        
        <div style="background: #f0f7ff; border-radius: 8px; padding: 20px; margin: 20px 0; text-align: center;">
          <p style="margin: 0;"><strong>Reset Code:</strong></p>
          <h1 style="color: #667eea; font-size: 32px; letter-spacing: 5px; margin: 10px 0;">${data.resetCode}</h1>
          <p style="color: #666; font-size: 14px;">This code will expire in ${data.expiryMinutes} minutes</p>
        </div>

        <p><strong>Instructions:</strong></p>
        <ol>
          <li>Go to the password reset page</li>
          <li>Enter the reset code above</li>
          <li>Create your new password</li>
        </ol>

        <p><strong>Security Tips:</strong></p>
        <ul>
          <li>Never share your password or reset code with anyone</li>
          <li>Create a strong password with letters, numbers, and symbols</li>
          <li>Use different passwords for different accounts</li>
        </ul>

        <p>If you didn't request this password reset, please ignore this email or contact support if you're concerned.</p>
      `,
    },

    // Event Created
    [NOTIFICATION_TEMPLATES.EVENT_CREATED]: {
      getTitle: (data: TemplateData) => `New Event Created!`,
      getSubject: (data: TemplateData) =>
        `Your Event "${data.eventTitle}" is Live`,
      getBody: (data: TemplateData) => `
        <h2>🎉 Your Event is Live!</h2>
        <p>Congratulations! Your event <strong>"${data.eventTitle}"</strong> has been successfully created and is now visible to attendees.</p>
        
        <div class="event-details">
          <div class="info-row">
            <span class="info-label">Event Status:</span>
            <span class="info-value" style="color: #10b981; font-weight: 600;">Live</span>
          </div>
          <div class="info-row">
            <span class="info-label">Event URL:</span>
            <span class="info-value"><a href="${data.eventUrl}">View Event Page</a></span>
          </div>
          <div class="info-row">
            <span class="info-label">Share Link:</span>
            <span class="info-value"><a href="${data.shareUrl}">Copy Share Link</a></span>
          </div>
        </div>

        <p><strong>Next Steps:</strong></p>
        <ul>
          <li>Share your event on social media to attract attendees</li>
          <li>Monitor ticket sales from your organizer dashboard</li>
          <li>Update event details if needed</li>
          <li>Prepare event materials and communications</li>
        </ul>

        <p><strong>Need to make changes?</strong></p>
        <p>You can edit your event details, ticket types, and settings anytime from your organizer dashboard.</p>

        <p>Good luck with your event! 🚀</p>
      `,
    },

    // Attendee Checked In
    [NOTIFICATION_TEMPLATES.ATTENDEE_CHECKED_IN]: {
      getTitle: (data: TemplateData) => `Checked In Successfully!`,
      getSubject: (data: TemplateData) =>
        `Check-in Confirmation - ${data.eventTitle}`,
      getBody: (data: TemplateData) => `
        <h2>✅ Check-in Successful</h2>
        <p>You have been successfully checked into <strong>${data.eventTitle}</strong>.</p>
        
        <div class="event-details">
          <div class="info-row">
            <span class="info-label">Check-in Time:</span>
            <span class="info-value">${data.checkInTime}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Checked in by:</span>
            <span class="info-value">${data.checkedInBy}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Ticket Number:</span>
            <span class="info-value">${data.ticketNumber}</span>
          </div>
        </div>

        <p><strong>Enjoy the event!</strong></p>
        <p>We hope you have a fantastic time. Here are a few tips:</p>
        <ul>
          <li>Keep your phone handy for any event updates</li>
          <li>Follow event rules and guidelines</li>
          <li>Network with other attendees</li>
          <li>Don't hesitate to ask organizers for help</li>
        </ul>

        <p>After the event, you'll receive a follow-up email where you can share your feedback.</p>
      `,
    },

    // Account Verification
    [NOTIFICATION_TEMPLATES.ACCOUNT_VERIFICATION]: {
      getTitle: (data: TemplateData) => `Verify Your Account`,
      getSubject: (data: TemplateData) => `Verify Your EventHub Account`,
      getBody: (data: TemplateData) => `
        <h2>Verify Your Email Address</h2>
        <p>Thank you for signing up! Please verify your email address to complete your registration.</p>
        
        <div style="text-align: center; margin: 30px 0;">
          <p>Click the button below to verify your email:</p>
          <a href="${data.verificationUrl}" class="button">Verify Email Address</a>
        </div>

        <p style="font-size: 14px; color: #666; text-align: center;">
          Or copy and paste this link in your browser:<br/>
          <span style="color: #667eea; word-break: break-all;">${data.verificationUrl}</span>
        </p>

        <p><strong>Why verify?</strong></p>
        <ul>
          <li>Secure your account</li>
          <li>Receive important event notifications</li>
          <li>Access all features of EventHub</li>
          <li>Get personalized event recommendations</li>
        </ul>

        <p>This verification link will expire in 24 hours.</p>
      `,
    },
  }
}
