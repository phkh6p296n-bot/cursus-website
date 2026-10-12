// Booking requests. Set LEAD_ENDPOINT at build time (see scripts/build.mjs and CLAUDE.md),
// e.g. the URL of the Supabase Edge Function in supabase/functions/lead.
// Without an endpoint the form runs in preview mode and sends nothing.
declare const __LEAD_ENDPOINT__: string;

export const LEAD_ENDPOINT: string = typeof __LEAD_ENDPOINT__ !== 'undefined' ? __LEAD_ENDPOINT__ : '';

export interface Lead {
  name: string;
  company: string;
  email: string;
  phone: string;
  role: 'forwarder' | 'carrier' | 'both';
  trucksPerMonth: number | null;
  message: string;
  /** Preferred slots as local Central European times, e.g. "2026-10-14 09:30". */
  slots: string[];
  lang: 'de' | 'en';
  /** Honeypot, must stay empty. */
  website: string;
}

export async function submitLead(lead: Lead): Promise<'sent' | 'preview'> {
  if (!LEAD_ENDPOINT) {
    await new Promise((r) => setTimeout(r, 700));
    return 'preview';
  }
  const res = await fetch(LEAD_ENDPOINT, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ ...lead, source: 'website' }),
  });
  if (!res.ok) throw new Error(`Lead endpoint returned ${res.status}`);
  return 'sent';
}
