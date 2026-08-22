// Supabase Edge Function: notify-contact
//
// Triggered by a Database Webhook on INSERT into public.contact_submissions.
// Sends Thom an email via Resend whenever a new contact form submission
// comes in.
//
// Deploy with:
//   supabase functions deploy notify-contact
//
// Set secrets with:
//   supabase secrets set RESEND_API_KEY=your_resend_api_key
//   supabase secrets set NOTIFY_TO_EMAIL=thom@example.com
//   supabase secrets set NOTIFY_FROM_EMAIL="Arboren CAThedrals <onboarding@resend.dev>"

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
const NOTIFY_TO_EMAIL = Deno.env.get('NOTIFY_TO_EMAIL');
const NOTIFY_FROM_EMAIL = Deno.env.get('NOTIFY_FROM_EMAIL') ?? 'onboarding@resend.dev';

Deno.serve(async (req) => {
  try {
    const payload = await req.json();
    const record = payload.record ?? {};
    const { name, email, message } = record;

    if (!RESEND_API_KEY || !NOTIFY_TO_EMAIL) {
      console.error('Missing RESEND_API_KEY or NOTIFY_TO_EMAIL secret');
      return new Response('Server not configured', { status: 500 });
    }

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: NOTIFY_FROM_EMAIL,
        to: NOTIFY_TO_EMAIL,
        reply_to: email,
        subject: `New catio inquiry from ${name}`,
        text: `Name: ${name}\nEmail: ${email}\n\n${message}`,
      }),
    });

    if (!res.ok) {
      const body = await res.text();
      console.error('Resend API error:', res.status, body);
      return new Response('Failed to send email', { status: 502 });
    }

    return new Response('OK', { status: 200 });
  } catch (err) {
    console.error('notify-contact error:', err);
    return new Response('Bad request', { status: 400 });
  }
});
