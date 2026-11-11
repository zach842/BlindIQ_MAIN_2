const { test } = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { join } = require('node:path');
const { states } = require(join(process.env.BLINDIQ_TEST_OUTPUT, 'data.js'));
const { countBirds, duckBagLimit, effectiveBirdLimit, remainingBirds, localDateKey } = require(join(process.env.BLINDIQ_TEST_OUTPUT, 'harvestLimits.js'));
const { getDashboardSeasonStatus } = require(join(process.env.BLINDIQ_TEST_OUTPUT, 'seasonStatus.js'));
const { statusPeriodsByState } = require(join(process.env.BLINDIQ_TEST_OUTPUT, 'seasonCalendars.js'));
const state = code => states.find(s => s.code === code);
const bird = (code, id) => state(code).birds.find(b => b.id === id);
const limit = (code, id, zone, date) => effectiveBirdLimit(bird(code, id), zone, date);
const left = (code, id, harvest, zone = state(code).zones[0], date = '2026-11-11') => remainingBirds(state(code), bird(code, id), harvest, zone, date);

test('all 29 original states retained without duplicate birds or invalid caps', () => {
  assert.deepEqual(states.map(s => s.code).sort(), 'MD DE VA NC PA NY WV SC LA TX AR ND SD WI IL MT MN KS CA FL IA MI MO NE NJ OH ID OR WA'.split(' ').sort());
  for (const s of states) {
    assert.equal(new Set(s.birds.map(b => b.id)).size, s.birds.length, s.code);
    assert.ok(s.seasonYear.startsWith('2026'), s.code);
    for (const b of s.birds) {
      assert.ok(Number.isInteger(b.limit) && b.limit >= 0, `${s.code} ${b.id}`);
      for (const p of b.limitPeriods ?? []) {
        assert.ok(p.startDate <= p.endDate);
        assert.equal(new Date(p.startDate).toISOString().slice(0, 10), p.startDate);
        assert.equal(new Date(p.endDate).toISOString().slice(0, 10), p.endDate);
        if (p.zone) assert.ok(s.zones.includes(p.zone), `${s.code} ${p.zone}`);
      }
    }
  }
});

test('mallard hens and drakes share the aggregate cap', () => {
  assert.equal(left('TX', 'mallard-drake', { 'mallard-hen': 2, 'mallard-drake': 2 }), 1);
  assert.equal(left('TX', 'mallard-hen', { 'mallard-hen': 2 }), 0);
  assert.equal(left('MD', 'mallard-hen', { 'mallard-drake': 4 }), 0);
});
test('separate merganser bag stays available after six ducks; hooded cap shares five', () => {
  for (const code of ['SC', 'MN', 'WI', 'MI', 'IA', 'IL', 'OH']) {
    const sixDucks = { 'mallard-drake': 4, 'wood-duck': 2 };
    assert.equal(left(code, 'other-merganser', sixDucks), 5, code);
    assert.equal(left(code, 'hooded-merganser', { ...sixDucks, 'other-merganser': 5 }), 0, code);
    assert.equal(left(code, 'other-merganser', { 'hooded-merganser': 1, 'other-merganser': 3 }), 1, code);
  }
});
test('separate dark-goose bags are not constrained by the duck aggregate', () => {
  assert.equal(left('MI', 'canada-goose', { 'mallard-drake': 4, 'wood-duck': 2 }), 5);
  assert.equal(left('MI', 'canada-goose', { brant: 1, 'white-fronted-goose': 3 }), 1);
  assert.equal(left('SC', 'white-fronted-goose', { 'canada-goose': 4 }), 1);
  assert.equal(left('MO', 'brant', { 'canada-goose': 3 }), 0);
});
test('California dark-goose and South Carolina black/mottled caps honor the selected zone', () => {
  assert.equal(left('CA', 'white-fronted-goose', {}, 'Southern California Zone'), 3);
  assert.equal(left('CA', 'canada-goose', { 'white-fronted-goose': 3 }, 'Southern California Zone'), 0);
  assert.equal(left('SC', 'mottled-duck', { 'black-duck': 1 }, 'East and South of I-95'), 0);
  assert.equal(left('SC', 'mottled-duck', { 'black-duck': 1 }, 'West and North of I-95'), 1);
  assert.equal(left('SC', 'mottled-duck', { 'black-duck': 1 }, 'Statewide'), 0);
});
test('duck-plus-merganser states include mergansers in the correct aggregate', () => {
  for (const code of ['TX', 'NY', 'ID', 'OR', 'WA', 'KS', 'SD', 'NE']) {
    const s = state(code), zone = s.zones[0], max = duckBagLimit(s, zone);
    assert.equal(left(code, 'merganser', { 'other-duck': max }, zone), 0, code);
  }
});
test('date-dependent scaup caps change at verified boundaries', () => {
  for (const [code, zone, before, after] of [
    ['MD', 'Eastern Duck Zone', '2027-01-07', '2027-01-08'],
    ['DE', 'Statewide Duck Zone', '2027-01-11', '2027-01-12'],
    ['VA', 'Statewide Duck Zone', '2027-01-11', '2027-01-12'],
    ['NC', 'Inland Duck Zone', '2027-01-07', '2027-01-08'],
    ['WV', 'Statewide', '2027-01-11', '2027-01-12'],
    ['MN', 'North Waterfowl Zone', '2026-10-10', '2026-10-11'],
    ['IA', 'North Zone', '2026-10-24', '2026-10-25'],
    ['IA', 'Central Zone', '2026-10-31', '2026-11-01'],
    ['IA', 'South Zone', '2026-11-07', '2026-11-08'],
    ['OH', 'Duck Zone B', '2026-11-26', '2026-11-27'],
    ['NJ', 'North Zone', '2026-12-22', '2026-12-23'],
    ['MI', 'South Zone', '2026-11-01', '2026-11-02'],
  ]) {
    assert.equal(limit(code, 'scaup', zone, before), 1, `${code} before`);
    assert.equal(limit(code, 'scaup', zone, after), 2, `${code} after`);
  }
  assert.equal(limit('WI', 'scaup', 'Northern Duck Zone', '2026-11-09'), 2);
  assert.equal(limit('WI', 'scaup', 'Northern Duck Zone', '2026-11-10'), 1);
  assert.equal(limit('MO', 'scaup', 'North Zone', '2026-12-14'), 2);
  assert.equal(limit('MO', 'scaup', 'North Zone', '2026-12-15'), 1);
});
test('Pacific scaup closures and bonus-teal windows are enforced', () => {
  assert.equal(limit('WA', 'scaup', 'West Duck Zone', '2026-11-06'), 0);
  assert.equal(limit('WA', 'scaup', 'West Duck Zone', '2026-11-07'), 2);
  assert.equal(limit('OR', 'scaup', 'Duck Zone 2', '2027-01-07'), 0);
  assert.equal(limit('ID', 'scaup', 'Duck Area 3', '2026-10-28'), 0);
  assert.equal(limit('ID', 'scaup', 'Duck Area 3', '2026-10-29'), 2);
  assert.equal(limit('MT', 'scaup', 'Pacific Flyway', '2026-12-28'), 0);
  assert.equal(limit('ND', 'bonus-bluewing-teal', state('ND').zones[0], '2026-10-04'), 2);
  assert.equal(limit('ND', 'bonus-bluewing-teal', state('ND').zones[0], '2026-10-05'), 0);
  assert.equal(limit('MT', 'bonus-bluewing-teal', 'Pacific Flyway', '2026-10-04'), 0);
});
test('total harvest includes coots, mergansers, and bonus birds', () => {
  const h = { 'mallard-drake': 3, 'canada-goose': 2, coot: 4, 'other-merganser': 1 };
  assert.equal(countBirds(state('MI'), h), 10);
  assert.equal(countBirds(state('MI'), h, 'Ducks'), 3);
});
test('published corrections appear in display data and banner calendars', () => {
  assert.equal(bird('MN', 'pintail').limit, 3);
  assert.match(state('MN').seasons.find(s => s.name === 'Early Goose').dates, /Sept 5–20/);
  assert.equal(statusPeriodsByState.MN.find(p => p.name === 'Early Goose').endDate, '2026-09-20');
  assert.match(state('CA').seasons.find(s => s.name.startsWith('Veteran')).dates, /Jan 16–17/);
  assert.match(state('MO').seasons.find(s => s.name === 'Canada Geese & Brant').dates, /Oct 3–11/);
  assert.equal(state('WV').dataStatus, 'current');
  assert.ok(!state('DE').seasons.some(s => /proposal option/.test(s.name)));
});
test('all state/zone/bird combinations obey bag and parent arithmetic under full bags', () => {
  for (const s of states) for (const zone of s.zones) for (const b of s.birds) {
    const cap = effectiveBirdLimit(b, zone, '2026-11-11');
    assert.equal(remainingBirds(s, b, { [b.id]: cap }, zone, '2026-11-11'), 0, `${s.code}/${zone}/${b.id}`);
    assert.ok(remainingBirds(s, b, {}, zone, '2026-11-11') <= cap);
    if (b.group === 'Ducks') assert.ok(remainingBirds(s, b, {}, zone) <= duckBagLimit(s, zone));
  }
});
test('calendar data contains valid inclusive 2026–27 intervals', () => {
  for (const s of states) for (const p of s.statusPeriods ?? statusPeriodsByState[s.code] ?? []) {
    assert.ok(p.startDate <= p.endDate, `${s.code} ${p.name}`);
    assert.match(p.startDate, /^202[67]-\d\d-\d\d$/);
    const d = new Date(`${p.startDate}T12:00:00`);
    assert.equal(localDateKey(d), p.startDate);
    const result = getDashboardSeasonStatus(s, d);
    assert.ok(result.activePeriods.some(active => active.name === p.name) || result.kind === 'closed');
  }
});

test('the dated verification report accounts for every supported state', () => {
  const audit = JSON.parse(readFileSync('docs/regulation-audit-2026-2027.json', 'utf8'));
  assert.equal(audit.reviewDate, '2026-11-11');
  assert.deepEqual(audit.states.map(s => s.code).sort(), states.map(s => s.code).sort());
  assert.deepEqual(audit.states.filter(s => s.status === 'resolved-source-conflict').map(s => s.code).sort(), ['IL', 'SD']);
  for (const s of audit.states) assert.ok(s.sources.length > 0 && s.sources.every(source => source.url.startsWith('https://')));
});
test('Sunday migratory closures override broad calendar ranges', () => {
  for (const code of ['PA', 'NC', 'NJ']) {
    const result = getDashboardSeasonStatus(state(code), new Date('2026-11-22T12:00:00'));
    assert.equal(result.headline, 'CLOSED SUNDAY');
    assert.equal(result.activePeriods.length, 0);
  }
});
test('Louisiana scaup, mottled ducks and separate mergansers follow the LDWF table', () => {
  assert.equal(limit('LA', 'scaup', 'West Waterfowl Zone', '2026-11-28'), 1);
  assert.equal(limit('LA', 'scaup', 'West Waterfowl Zone', '2026-11-29'), 2);
  assert.equal(limit('LA', 'mottled-duck', 'East Waterfowl Zone', '2026-12-05'), 0);
  assert.equal(limit('LA', 'mottled-duck', 'East Waterfowl Zone', '2026-12-06'), 1);
  assert.equal(left('LA', 'merganser', { 'mallard-drake': 4, 'wood-duck': 2 }), 5);
  assert.equal(left('LA', 'hooded-merganser', { merganser: 4 }), 1);
});
test('early goose entries cannot create a second goose bag in September', () => {
  for (const code of ['MD', 'DE', 'SC']) {
    assert.equal(limit(code, 'early-canada-goose', state(code).zones[0], '2026-11-11'), 0);
    assert.equal(limit(code, 'canada-goose', state(code).zones[0], '2026-09-05'), 0);
    assert.ok(limit(code, 'early-canada-goose', state(code).zones[0], '2026-09-05') > 0);
  }
});
test('early teal is restricted to its selected Kansas unit dates', () => {
  assert.equal(limit('KS', 'early-teal', 'High Plains Unit', '2026-09-18'), 0);
  assert.equal(limit('KS', 'early-teal', 'High Plains Unit', '2026-09-19'), 6);
  assert.equal(limit('KS', 'early-teal', 'Low Plains Early Zone', '2026-09-21'), 0);
});
test('final Illinois card supersedes reversed scaup values on the landing page', () => {
  assert.equal(state('IL').dataStatus, 'current');
  assert.equal(limit('IL', 'scaup', 'North Waterfowl Zone', '2026-11-12'), 1);
  assert.equal(limit('IL', 'scaup', 'North Waterfowl Zone', '2026-11-13'), 2);
  assert.equal(limit('IL', 'scaup', 'South Waterfowl Zone', '2026-11-28'), 1);
  assert.equal(limit('IL', 'scaup', 'South Waterfowl Zone', '2026-11-29'), 2);
  assert.equal(limit('IL', 'canada-goose', 'South Waterfowl Zone', '2026-09-01'), 2);
  assert.equal(limit('IL', 'canada-goose', 'North Waterfowl Zone', '2026-09-01'), 5);
});
test('the dashboard includes only intervals active on the local date, through every boundary', () => {
  for (const s of states) {
    const calendar = s.statusPeriods ?? statusPeriodsByState[s.code] ?? [];
    for (const p of calendar) for (const key of [p.startDate, p.endDate]) {
      const date = new Date(`${key}T12:00:00`);
      const result = getDashboardSeasonStatus(s, date);
      if (['PA', 'NC', 'NJ'].includes(s.code) && date.getDay() === 0) continue;
      assert.ok(result.activePeriods.includes(p), `${s.code}/${key}/${p.name}`);
      for (const active of result.activePeriods) assert.ok(active.startDate <= key && active.endDate >= key);
    }
  }
});
