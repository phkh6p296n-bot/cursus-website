// Supabase Edge Function: stores a booking request and notifies the team by email via Resend.
// Deploy:  supabase functions deploy lead --no-verify-jwt
// Secrets: supabase secrets set RESEND_API_KEY=... LEAD_NOTIFY_TO=team@example.com LEAD_FROM="cursus <hello@your-domain>" ALLOWED_ORIGIN=https://your-domain
// SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are provided by Supabase automatically.
import { createClient } from 'npm:@supabase/supabase-js@2.45.4';

const ALLOWED_ORIGIN = Deno.env.get('ALLOWED_ORIGIN') ?? '*';
const cors = {
  'Access-Control-Allow-Origin': ALLOWED_ORIGIN,
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'content-type',
};

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, 'content-type': 'application/json' } });

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const clip = (v: unknown, n: number) => (typeof v === 'string' ? v.trim().slice(0, n) : '');
const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: cors });
  if (req.method !== 'POST') return json(405, { error: 'method' });

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return json(400, { error: 'json' });
  }
  // Honeypot: bots fill every field. Answer "ok" so they do not retry.
  if (clip(body.website, 200)) return json(200, { ok: true });

  const lead = {
    name: clip(body.name, 120),
    company: clip(body.company, 160),
    email: clip(body.email, 200),
    phone: clip(body.phone, 60) || null,
    role: ['forwarder', 'carrier', 'both'].includes(String(body.role)) ? String(body.role) : '',
    trucks_per_month: Number.isFinite(Number(body.trucksPerMonth)) && body.trucksPerMonth !== null ? Math.max(0, Math.round(Number(body.trucksPerMonth))) : null,
    message: clip(body.message, 2000) || null,
    slots: Array.isArray(body.slots) ? body.slots.slice(0, 3).map((s) => clip(s, 32)) : [],
    lang: body.lang === 'en' ? 'en' : 'de',
    source: clip(body.source, 40) || 'website',
  };
  if (!lead.name || !lead.company || !EMAIL.test(lead.email) || !lead.role || !lead.slots.length) {
    return json(422, { error: 'validation' });
  }

  const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
  const { error } = await supabase.from('leads').insert(lead);
  if (error) {
    console.error(error);
    return json(500, { error: 'db' });
  }

  const key = Deno.env.get('RESEND_API_KEY');
  const to = Deno.env.get('LEAD_NOTIFY_TO');
  const from = Deno.env.get('LEAD_FROM');
  if (key && to && from) {
    const html = `<h2>Neue Anfrage für ein Erstgespräch</h2>
<p><b>${esc(lead.name)}</b>, ${esc(lead.company)} (${esc(lead.role)})<br>
${esc(lead.email)}${lead.phone ? ` · ${esc(lead.phone)}` : ''}</p>
<p>LKW pro Monat: ${lead.trucks_per_month ?? '–'}</p>
<p>Wunschtermine:<br>${lead.slots.map(esc).join('<br>')}</p>
${lead.message ? `<p>Nachricht:<br>${esc(lead.message)}</p>` : ''}`;
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, 'content-type': 'application/json' },
      body: JSON.stringify({ from, to: to.split(','), reply_to: lead.email, subject: `Erstgespräch: ${lead.company}`, html }),
    });
    if (!res.ok) console.error('resend', res.status, await res.text());
  }
  return json(200, { ok: true });
});
