// Pure scheduling policy shared by the processor and local tests.
export function localParts(now: Date, timeZone: string) {
  try {
    const parts = Object.fromEntries(new Intl.DateTimeFormat('en-CA', { timeZone, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).formatToParts(now).map(p => [p.type, p.value]));
    return { date: `${parts.year}-${parts.month}-${parts.day}`, hour: Number(parts.hour), minute: Number(parts.minute) };
  } catch { return null; }
}
export function shiftDate(value: string, days: number) { const d = new Date(value + 'T12:00:00Z'); d.setUTCDate(d.getUTCDate() + days); return d.toISOString().slice(0, 10); }
export type SeasonPeriod = { id: string; state_code: string; state_name: string; season_name: string; category: string; zone: string; start_date: string; end_date: string; source_url: string; data_status: string; verification_status: string; verified_at: string | null; time_zone: string | null; conditions: string | null };
export function seasonNotices(period: SeasonPeriod, now = new Date()) {
  const local = period.time_zone ? localParts(now, period.time_zone) : null;
  const verified = Date.parse(period.verified_at || '');
  if (!local || period.verification_status !== 'verified' || period.data_status !== 'current' || !Number.isFinite(verified) || verified > now.getTime() || now.getTime() - verified > 90 * 86400000 || !/^https:\/\//.test(period.source_url)) return [];
  if (!/^\d{4}-\d{2}-\d{2}$/.test(period.start_date) || !/^\d{4}-\d{2}-\d{2}$/.test(period.end_date) || period.end_date < period.start_date) return [];
  const {date} = local;
  const definitions = [
    [period.start_date === shiftDate(date, 1), 'season_open_tomorrow', 'starts tomorrow', period.start_date],
    [period.start_date === date, 'season_open', 'starts today', period.start_date],
    [period.end_date === date, 'season_closes_today', 'has its final day today', period.end_date],
    [period.end_date === shiftDate(date, -1), 'season_closed', 'segment ended yesterday', period.end_date],
  ] as const;
  return definitions.filter(([due]) => due).map(([, type, phrase, boundary]) => ({
    event_key: `${type}:${period.id}:${boundary}`, event_type: type, audience_kind: 'state', target_value: period.state_code,
    title: `${period.state_name}: ${period.season_name} ${phrase}`,
    body: `${period.zone}. ${period.conditions ? period.conditions + ' ' : ''}Verify official dates, eligibility and legal hunting hours.`,
    url: '/?view=notifications', priority: 'normal',
    payload: {periodId: period.id, stateCode: period.state_code, zone: period.zone, category: period.category, sourceUrl: period.source_url, localDate: date, timeZone: period.time_zone, verifiedAt: period.verified_at},
  }));
}
export function hashText(value: string) { let hash = 2166136261; for (const c of value) { hash ^= c.charCodeAt(0); hash = Math.imul(hash, 16777619); } return hash >>> 0; }
export function nudgeDue(input: {userId: string; enabled: boolean; timezone: string; everyDays: number; hour: number; joinedAt: string; lastHuntAt?: string | null; lastNudgeAt?: string | null}, now = new Date()) {
  if (!input.enabled || !Number.isInteger(input.everyDays) || input.everyDays < 7 || input.everyDays > 30 || !Number.isInteger(input.hour) || input.hour < 8 || input.hour > 20) return null;
  const local = localParts(now, input.timezone); if (!local) return null;
  const last = Date.parse(input.lastHuntAt || input.joinedAt), previous = input.lastNudgeAt ? Date.parse(input.lastNudgeAt) : null;
  if (!Number.isFinite(last) || (previous !== null && !Number.isFinite(previous))) return null;
  if (now.getTime() - last < input.everyDays * 86400000 || (previous !== null && now.getTime() - previous < input.everyDays * 86400000)) return null;
  // A stable 15-minute slot within the chosen local hour varies by day/user.
  const slot = hashText(input.userId + ':' + local.date) % 4;
  if (local.hour !== input.hour || Math.floor(local.minute / 15) !== slot) return null;
  return `logging-nudge:${input.userId}:${local.date}`;
}

export function stateAudienceMatches(nationwide: boolean, followed: string[], code: string) { return /^[A-Z]{2}$/.test(code) && (nationwide || followed.includes(code)); }
