import { Resend } from 'resend';
import { NextResponse } from 'next/server';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: Request) {
  const { subject, html } = await req.json() as { subject: string; html: string };

  const apiKey = process.env.RESEND_API_KEY;
  const to   = process.env.ALERT_EMAIL_TO;
  const from = process.env.ALERT_EMAIL_FROM;

  if (!apiKey) throw new Error("Missing RESEND_API_KEY in .env.local");
  if (!to) throw new Error("Missing ALERT_EMAIL_TO in .env.local");
  if (!from) throw new Error("Missing ALERT_EMAIL_FROM in .env.local");

  const { data, error } = await resend.emails.send({ from, to, subject, html });

  if (error) {
    console.error('[alert] Resend error:', error);
    return NextResponse.json({ error }, { status: 500 });
  }

  return NextResponse.json({ data });
}
