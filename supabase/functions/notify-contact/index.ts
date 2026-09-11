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
const NOTIFY_TO_EMAIL = Deno.env.get('NOTIFY_TO_EMAIL')?.split(',').map((s) => s.trim()).filter(Boolean) ?? [];
const NOTIFY_FROM_EMAIL = Deno.env.get('NOTIFY_FROM_EMAIL') ?? 'onboarding@resend.dev';

Deno.serve(async (req) => {
  try {
    const payload = await req.json();
    const record = payload.record ?? {};
    const {
      name,
      email,
      phone,
      contact_method,
      best_time,
      zipcode,
      services,
      planning_process,
      message,
      files,
    } = record;

    if (!RESEND_API_KEY || NOTIFY_TO_EMAIL.length === 0) {
      console.error('Missing RESEND_API_KEY or NOTIFY_TO_EMAIL secret');
      return new Response('Server not configured', { status: 500 });
    }

    const displayLabels: Record<string, string> = {
      text: 'Text',
      phone: 'Phone',
      email: 'Email',
      mornings: 'Mornings',
      afternoons: 'Afternoons',
      evenings: 'Evenings',
      arboren_cathedrals_catios: 'Arboren Cathedrals Catios!',
      diy_catio_plans: 'Purchasing plans for a DIY Catio',
      other_services: 'Other Services',
      laser_cutting: 'Laser cutting',
      engraving: 'Engraving',
      '3d_design_printing': '3D design / printing',
      just_talk: "I'm not planning a project, but I'd like to talk to you.",
      inspired_curious: "I'm inspired and curious, let's discuss options.",
      turn_ideas: 'Help turn my ideas into a project.',
      finalizing_plan: "I'm finalizing my plan and prepping the catio location.",
      ready_to_go: "I'm ready to go with plans and a prepped site.",
    };

    function display(value: unknown) {
      return displayLabels[String(value)] ?? String(value ?? '');
    }

    function formatList(values: unknown[]) {
      return values.map((v) => `- ${display(v)}`).join('\n');
    }

    const sections = [];
    sections.push(`**Name:**\n${display(name)}`);
    sections.push(`**Email:**\n${display(email)}`);
    if (phone) sections.push(`**Phone:**\n${display(phone)}`);
    if (contact_method?.length) {
      sections.push(`**Best way to contact you:**\n${formatList(Array.isArray(contact_method) ? contact_method : [contact_method])}`);
    }
    if (best_time?.length) {
      sections.push(`**Best time to contact you:**\n${formatList(best_time)}`);
    }
    if (zipcode) sections.push(`**Zipcode:**\n${display(zipcode)}`);
    if (services?.length) {
      sections.push(`**What services are you interested in?**\n${formatList(services)}`);
    }
    if (planning_process) {
      sections.push(`**Where are you in the planning process?**\n${display(planning_process)}`);
    }
    sections.push(`**Add your comments, questions, or describe your project:**\n${display(message)}`);

    if (files?.length) {
      const fileLines = files.map((file: any) => `- ${file.name}${file.url ? `: ${file.url}` : ''}`);
      sections.push(`**Attachments:**\n${fileLines.join('\n')}`);
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
        text: sections.join('\n\n'),
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
