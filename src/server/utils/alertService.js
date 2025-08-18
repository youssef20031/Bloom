// Minimal alertService stub
export async function sendAlertEmail({ email, ip, count }) {
  // In production, integrate with an email service
  console.log(`ALERT: ${count} failed login attempts for ${email} from IP ${ip}`);
}

