import { Resend } from 'resend'
import config from '../config'
import { ISendEmail } from '../interfaces/email'

const resend = new Resend(config.email.resend_api_key)

const sendEmail = async (values: ISendEmail) => {
  try {
    const { data, error } = await resend.emails.send({
      from: `gathering <${config.email.from}>`,
      to: values.to,
      subject: values.subject,
      html: values.html,
    })

    if (error) {
      console.error('Resend email error:', error)
      return
    }

    console.log('Mail sent successfully', data?.id)
  } catch (error) {
    console.log({ error })
    console.error('Email send failed:', error)
  }
}

export const emailHelper = {
  sendEmail,
}
