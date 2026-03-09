import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)
const FROM = 'noreply@yourdomain.com' // TODO: update with your verified Resend domain

export async function sendOtpEmail(email: string, code: string): Promise<void> {
  await resend.emails.send({
    from: FROM,
    to: email,
    subject: `${code} — tu código de verificación`,
    html: `
      <div style="font-family: monospace; max-width: 480px; margin: 0 auto; padding: 40px 24px; background: #0F1C17; color: #EDE8D8; border-radius: 12px;">
        <h1 style="font-size: 14px; letter-spacing: 4px; text-transform: uppercase; color: #7A9E93; margin: 0 0 32px;">
          Expense Splitter
        </h1>
        <p style="font-size: 16px; color: #EDE8D8; margin: 0 0 24px;">
          Tu código de verificación:
        </p>
        <div style="font-size: 48px; font-weight: bold; letter-spacing: 12px; color: #D4A84B; margin: 0 0 24px;">
          ${code}
        </div>
        <p style="font-size: 13px; color: #7A9E93; margin: 0;">
          Expira en 10 minutos. Si no solicitaste este código, ignorá este correo.
        </p>
      </div>
    `,
  })
}
