import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { prisma } from '@/lib/db';
import { sendEmail } from '@/lib/mailer';

function baseUrl(request: Request) {
  return process.env.NEXT_PUBLIC_APP_URL || new URL(request.url).origin;
}

async function readEmail(request: Request) {
  const contentType = request.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    const body = await request.json().catch(() => ({}));
    return String(body.email || '').trim().toLowerCase();
  }
  const form = await request.formData();
  return String(form.get('email') || '').trim().toLowerCase();
}

export async function POST(request: Request) {
  const email = await readEmail(request);
  const app = baseUrl(request);

  // Always respond the same way (no email enumeration).
  const done = NextResponse.redirect(new URL('/forgot-password?sent=1', app), { status: 303 });

  if (!email) return done;

  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (user) {
      const rawToken = crypto.randomBytes(32).toString('hex');
      const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

      // Invalidate previous unused tokens for this user.
      await prisma.passwordResetToken.updateMany({
        where: { userId: user.id, usedAt: null },
        data: { usedAt: new Date() }
      });

      await prisma.passwordResetToken.create({
        data: { userId: user.id, tokenHash, expiresAt }
      });

      const link = `${app}/reset-password?token=${rawToken}`;
      const html = `
        <div style="font-family:system-ui,Segoe UI,Arial,sans-serif;max-width:520px;margin:auto;padding:24px;color:#0f172a">
          <h2 style="margin:0 0 12px">Reset your NexOrder AI password</h2>
          <p style="color:#475569;line-height:1.6">We received a request to reset the password for your NexOrder AI account. Click the button below to set a new password. This link expires in 1 hour.</p>
          <p style="margin:24px 0">
            <a href="${link}" style="background:#3452FF;color:#fff;text-decoration:none;font-weight:700;padding:12px 20px;border-radius:10px;display:inline-block">Set a new password</a>
          </p>
          <p style="color:#94a3b8;font-size:13px;line-height:1.6">If you did not request this, you can safely ignore this email. Your password will not change.</p>
          <p style="color:#94a3b8;font-size:12px;word-break:break-all">Or paste this link into your browser:<br>${link}</p>
        </div>`;
      const text = `Reset your NexOrder AI password.\n\nOpen this link to set a new password (expires in 1 hour):\n${link}\n\nIf you did not request this, ignore this email.`;

      await sendEmail({ to: email, subject: 'Reset your NexOrder AI password', html, text });
    }
  } catch {
    // Do not reveal internal errors; keep the response identical.
  }

  return done;
}
