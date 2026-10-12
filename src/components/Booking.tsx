import { useMemo, useState } from 'react';
import { useI18n } from '../i18n';
import { submitLead, type Lead } from '../lib/lead';
import { Icon } from './Icon';

const SLOT_TIMES = ['09:30', '13:00', '16:00'];
const DAYS = 8;
const MAX_SLOTS = 3;

function workdays(from: Date, n: number) {
  const out: Date[] = [];
  const d = new Date(from);
  d.setHours(12, 0, 0, 0);
  while (out.length < n) {
    d.setDate(d.getDate() + 1);
    if (d.getDay() !== 0 && d.getDay() !== 6) out.push(new Date(d));
  }
  return out;
}

const iso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

type Field = 'name' | 'company' | 'email' | 'role' | 'slots' | 'size';

export function Booking() {
  const { d, t, lang } = useI18n();
  const days = useMemo(() => workdays(new Date(), DAYS), []);
  const [slots, setSlots] = useState<string[]>([]);
  const [form, setForm] = useState({ name: '', company: '', email: '', phone: '', role: '' as Lead['role'] | '', size: '', message: '', website: '' });
  const [errors, setErrors] = useState<Partial<Record<Field, string>>>({});
  const [state, setState] = useState<'idle' | 'sending' | 'sent' | 'preview' | 'error'>('idle');

  const set = (k: keyof typeof form, v: string) => {
    setForm({ ...form, [k]: v });
    if (errors[k as Field]) setErrors({ ...errors, [k]: undefined });
  };

  const toggleSlot = (s: string) => {
    setSlots((cur) => (cur.includes(s) ? cur.filter((x) => x !== s) : cur.length >= MAX_SLOTS ? cur : [...cur, s]));
    if (errors.slots) setErrors({ ...errors, slots: undefined });
  };

  const slotLabel = (s: string) => {
    const [date, time] = s.split(' ');
    const dt = new Date(`${date}T12:00:00`);
    return `${d.booking.days[dt.getDay()]} ${dt.getDate()}.${dt.getMonth() + 1}., ${time}`;
  };

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const err: Partial<Record<Field, string>> = {};
    if (!form.name.trim()) err.name = d.booking.errors.required;
    if (!form.company.trim()) err.company = d.booking.errors.required;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(form.email.trim())) err.email = d.booking.errors.email;
    if (!form.role) err.role = d.booking.errors.role;
    if (!slots.length) err.slots = d.booking.errors.slots;
    setErrors(err);
    if (Object.keys(err).length) return;
    setState('sending');
    try {
      const r = await submitLead({
        name: form.name.trim(),
        company: form.company.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        role: form.role as Lead['role'],
        trucksPerMonth: form.size ? Number(form.size) : null,
        message: form.message.trim(),
        slots,
        lang,
        website: form.website,
      });
      setState(r);
    } catch {
      setState('error');
    }
  }

  if (state === 'sent' || state === 'preview') {
    return (
      <section className="section section-ink" id="termin">
        <div className="container booking-done">
          <span className="done-icon" aria-hidden="true">
            <Icon name="check" size={28} />
          </span>
          <h2>{t(state === 'sent' ? d.booking.success : d.booking.previewTitle, { name: form.name.split(' ')[0] })}</h2>
          <p>{d.booking.successSlots}</p>
          <ul>
            {slots.map((s) => (
              <li key={s}>{slotLabel(s)}</li>
            ))}
          </ul>
          {state === 'preview' && <p className="preview-note">{d.booking.preview}</p>}
        </div>
      </section>
    );
  }

  return (
    <section className="section section-ink" id="termin">
      <div className="container booking">
        <div className="section-head on-dark">
          <p className="eyebrow">{d.booking.eyebrow}</p>
          <h2>{d.booking.title}</h2>
          <p className="section-lead">{d.booking.lead}</p>
          <div className="expect">
            <p className="expect-title">{d.booking.expectTitle}</p>
            <ol>
              {d.booking.expect.map((x) => (
                <li key={x}>{x}</li>
              ))}
            </ol>
          </div>
        </div>
        <form className="booking-form" onSubmit={onSubmit} noValidate>
          <fieldset className="slots">
            <legend>
              {d.booking.slotsLabel} <span className="slots-count">{t(d.booking.selected, { n: slots.length })}</span>
            </legend>
            <div className="slot-days">
              {days.map((day) => (
                <div className="slot-day" key={iso(day)}>
                  <p className="slot-date">
                    <span>{d.booking.days[day.getDay()]}</span> {day.getDate()}.{day.getMonth() + 1}.
                  </p>
                  {SLOT_TIMES.map((time) => {
                    const s = `${iso(day)} ${time}`;
                    const on = slots.includes(s);
                    const full = !on && slots.length >= MAX_SLOTS;
                    return (
                      <button key={s} type="button" className={`slot ${on ? 'is-on' : ''}`} aria-pressed={on} disabled={full} onClick={() => toggleSlot(s)}>
                        {time}
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>
            <p className="slots-tz">{d.booking.tz}</p>
            {errors.slots && <p className="field-error">{errors.slots}</p>}
          </fieldset>

          <div className="fields">
            <label className="field">
              <span>{d.booking.fields.name}</span>
              <input id="bk-name" autoComplete="name" value={form.name} onChange={(e) => set('name', e.target.value)} aria-invalid={!!errors.name} />
              {errors.name && <em className="field-error">{errors.name}</em>}
            </label>
            <label className="field">
              <span>{d.booking.fields.company}</span>
              <input id="bk-company" autoComplete="organization" value={form.company} onChange={(e) => set('company', e.target.value)} aria-invalid={!!errors.company} />
              {errors.company && <em className="field-error">{errors.company}</em>}
            </label>
            <label className="field">
              <span>{d.booking.fields.email}</span>
              <input id="bk-email" type="email" autoComplete="email" value={form.email} onChange={(e) => set('email', e.target.value)} aria-invalid={!!errors.email} />
              {errors.email && <em className="field-error">{errors.email}</em>}
            </label>
            <label className="field">
              <span>{d.booking.fields.phone}</span>
              <input id="bk-phone" type="tel" autoComplete="tel" value={form.phone} onChange={(e) => set('phone', e.target.value)} />
            </label>
            <fieldset className="field field-wide">
              <legend>{d.booking.fields.role}</legend>
              <div className="segmented segmented-sm">
                {(['forwarder', 'carrier', 'both'] as const).map((r) => (
                  <button key={r} type="button" aria-pressed={form.role === r} className={form.role === r ? 'is-active' : ''} onClick={() => set('role', r)}>
                    {d.booking.fields.roles[r]}
                  </button>
                ))}
              </div>
              {errors.role && <em className="field-error">{errors.role}</em>}
            </fieldset>
            <label className="field field-wide">
              <span>{d.booking.fields.size}</span>
              <input id="bk-size" type="number" inputMode="numeric" min={0} value={form.size} onChange={(e) => set('size', e.target.value)} />
            </label>
            <label className="field field-wide">
              <span>{d.booking.fields.message}</span>
              <textarea id="bk-message" rows={3} value={form.message} onChange={(e) => set('message', e.target.value)} />
            </label>
            <label className="hp" aria-hidden="true">
              Website
              <input id="bk-website" tabIndex={-1} autoComplete="off" value={form.website} onChange={(e) => set('website', e.target.value)} />
            </label>
          </div>
          <div className="booking-submit">
            <button type="submit" className="btn btn-primary btn-lg" disabled={state === 'sending'}>
              {state === 'sending' ? d.booking.sending : d.booking.submit}
            </button>
            {state === 'error' && <p className="field-error">{d.booking.errors.send}</p>}
            <p className="consent">{d.booking.consent}</p>
          </div>
        </form>
      </div>
    </section>
  );
}
