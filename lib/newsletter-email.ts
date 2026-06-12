const SITE_URL = 'https://predictionsmarketfans.com';

/**
 * Branded welcome email for new newsletter subscribers.
 * Inline styles only (email clients strip <style> blocks).
 * Mirrors the site look: orange surface, white card, 2px black border, pop shadow.
 */
export function welcomeEmailHtml(unsubscribeUrl: string): string {
  return `<!DOCTYPE html>
<html lang="en">
  <body style="margin:0;padding:0;background-color:#FF8C00;font-family:Verdana,Geneva,sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#FF8C00;padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background-color:#FFFFFF;border:2px solid #000000;border-radius:16px;box-shadow:6px 6px 0 0 #000000;">
            <tr>
              <td style="padding:36px 36px 28px;">
                <p style="margin:0 0 8px;font-size:11px;font-weight:bold;letter-spacing:2px;text-transform:uppercase;color:#000000;background-color:#D9F24B;border:2px solid #000000;border-radius:999px;display:inline-block;padding:5px 14px;">Free Weekly Briefing</p>
                <h1 style="margin:16px 0 0;font-size:28px;line-height:1.2;color:#000000;font-family:Georgia,'Times New Roman',serif;">Welcome to The Weekly Signal &#127919;</h1>
                <p style="margin:16px 0 0;font-size:15px;line-height:1.6;color:#1A1A1A;">
                  You're on the list. Every Friday we distill the week's most important
                  prediction market movements into one concise, signal-rich briefing.
                  No noise. No filler.
                </p>
                <table role="presentation" cellpadding="0" cellspacing="0" style="margin:24px 0 0;width:100%;">
                  ${[
                    ['&#128200;', 'Market Movers', 'The biggest price swings across Polymarket, Kalshi, and Metaculus.'],
                    ['&#128218;', 'Research Digest', 'New studies on forecasting accuracy and calibration.'],
                    ['&#9889;', 'Strategy Insights', 'Trading patterns, arbitrage windows, and risk management.'],
                  ]
                    .map(
                      ([icon, title, desc]) => `<tr>
                    <td style="padding:6px 0;font-size:14px;line-height:1.5;color:#1A1A1A;">${icon} <strong style="color:#000000;">${title}</strong> &mdash; ${desc}</td>
                  </tr>`
                    )
                    .join('')}
                </table>
                <table role="presentation" cellpadding="0" cellspacing="0" style="margin:28px 0 0;">
                  <tr>
                    <td style="background-color:#FF00B8;border:2px solid #000000;border-radius:12px;box-shadow:4px 4px 0 0 #000000;">
                      <a href="${SITE_URL}" style="display:inline-block;padding:12px 24px;font-size:15px;font-weight:bold;color:#FFFFFF;text-decoration:none;">Read the latest analysis &rarr;</a>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td style="padding:20px 36px;border-top:2px solid #000000;background-color:#FFF8EE;border-radius:0 0 14px 14px;">
                <p style="margin:0;font-size:12px;line-height:1.6;color:#666666;">
                  You're receiving this because you subscribed at
                  <a href="${SITE_URL}" style="color:#4845F0;">predictionsmarketfans.com</a>.<br />
                  Don't want these emails? <a href="${unsubscribeUrl}" style="color:#4845F0;">Unsubscribe</a> anytime.
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

/**
 * Sends the welcome email via Resend. No-ops silently when RESEND_API_KEY
 * isn't configured, so signups always succeed regardless of email setup.
 *
 * Env vars:
 * - RESEND_API_KEY     — Resend API key (free tier: 3,000 emails/mo)
 * - NEWSLETTER_FROM    — verified sender, e.g. "The Weekly Signal <hello@predictionsmarketfans.com>"
 *                        (falls back to onboarding@resend.dev, which only delivers
 *                        to the Resend account owner — verify your domain for real sends)
 */
export async function sendWelcomeEmail(email: string, unsubscribeToken: string): Promise<void> {
  const resendKey = process.env.RESEND_API_KEY;
  if (!resendKey) return;

  const unsubscribeUrl = `${SITE_URL}/api/newsletter/unsubscribe?token=${unsubscribeToken}`;

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${resendKey}`,
      },
      body: JSON.stringify({
        from: process.env.NEWSLETTER_FROM || 'The Weekly Signal <onboarding@resend.dev>',
        to: [email],
        subject: "Welcome to The Weekly Signal — you're in! 🎯",
        html: welcomeEmailHtml(unsubscribeUrl),
        headers: {
          'List-Unsubscribe': `<${unsubscribeUrl}>`,
        },
      }),
    });
    if (!res.ok) {
      console.error('Welcome email Resend error:', await res.text());
    }
  } catch (err) {
    console.error('Welcome email send error:', err);
  }
}
