import { useCallback, useEffect, useMemo, useState } from 'react';

const STORAGE_KEY = 'gemspot-crowd-pulses';

function readPulses() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function writePulses(data) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    /* ignore */
  }
}

/** Hour-based baseline for Kenya nightlife / outdoor spots */
function baselineLevel(category, hour) {
  const cat = String(category || '').toLowerCase();
  if (cat === 'nightlife') {
    if (hour >= 22 || hour < 2) return 85;
    if (hour >= 19) return 65;
    if (hour >= 16) return 40;
    return 20;
  }
  if (cat === 'eats') {
    if (hour >= 12 && hour < 14) return 70;
    if (hour >= 18 && hour < 21) return 75;
    return 35;
  }
  if (cat === 'nature' || cat === 'action') {
    if (hour >= 9 && hour < 12) return 55;
    if (hour >= 14 && hour < 17) return 50;
    return 25;
  }
  return 40;
}

function labelFor(score) {
  if (score >= 80) return { key: 'packed', label: 'Packed', tone: 'hot' };
  if (score >= 60) return { key: 'busy', label: 'Busy', tone: 'warm' };
  if (score >= 35) return { key: 'moderate', label: 'Moderate', tone: 'ok' };
  return { key: 'quiet', label: 'Quiet', tone: 'cool' };
}

/**
 * Live crowd estimate for a place:
 * - baseline from category + local hour
 * - weighted average of community pulses (last 3 hours)
 * - refreshes every 45s so the UI feels live
 */
export function useCrowdLevel(placeId, category) {
  const id = String(placeId || '');
  const [now, setNow] = useState(() => Date.now());
  const [pulses, setPulses] = useState(() => (id ? readPulses()[id] || [] : []));

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 45000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (!id) return;
    const all = readPulses();
    setPulses(all[id] || []);
  }, [id, now]);

  const report = useCallback(
    (levelKey) => {
      if (!id) return;
      const map = { quiet: 20, moderate: 45, busy: 70, packed: 90 };
      const score = map[levelKey] ?? 45;
      const all = readPulses();
      const list = [...(all[id] || []), { score, at: Date.now(), key: levelKey }].slice(-30);
      all[id] = list;
      writePulses(all);
      setPulses(list);
      setNow(Date.now());
    },
    [id]
  );

  const live = useMemo(() => {
    const hour = new Date(now).getHours();
    let base = baselineLevel(category, hour);
    const cutoff = now - 3 * 60 * 60 * 1000;
    const recent = (pulses || []).filter((p) => p.at >= cutoff);
    if (recent.length) {
      const avg = recent.reduce((s, p) => s + p.score, 0) / recent.length;
      // community reports weigh more as they accumulate
      const w = Math.min(0.75, 0.25 + recent.length * 0.08);
      base = Math.round(base * (1 - w) + avg * w);
    }
    // tiny jitter so the meter feels alive
    const jitter = Math.sin(now / 60000 + (id || '').length) * 3;
    const score = Math.max(5, Math.min(98, Math.round(base + jitter)));
    const meta = labelFor(score);
    return {
      score,
      ...meta,
      reportsLast3h: recent.length,
      updatedAt: now,
      report,
    };
  }, [now, pulses, category, id, report]);

  return live;
}

export function safetyLevelFromPlace(place) {
  const raw = place?.safetyLevel || place?.safety_level || place?.safety;
  if (typeof raw === 'number') {
    if (raw >= 4) return { key: 'high', label: 'High', score: raw };
    if (raw >= 3) return { key: 'good', label: 'Good', score: raw };
    if (raw >= 2) return { key: 'moderate', label: 'Moderate', score: raw };
    return { key: 'caution', label: 'Use caution', score: raw };
  }
  if (typeof raw === 'string' && raw.trim()) {
    const s = raw.toLowerCase();
    if (/high|safe|excellent/.test(s)) return { key: 'high', label: raw, score: 5 };
    if (/good|ok|fine/.test(s)) return { key: 'good', label: raw, score: 4 };
    if (/moderate|average/.test(s)) return { key: 'moderate', label: raw, score: 3 };
    return { key: 'caution', label: raw, score: 2 };
  }
  // Heuristic from parking / area / category
  const cat = String(place?.category || '').toLowerCase();
  if (place?.parking && cat !== 'nightlife') return { key: 'good', label: 'Good', score: 4 };
  if (cat === 'nightlife') return { key: 'moderate', label: 'Moderate — stay aware', score: 3 };
  if (cat === 'nature') return { key: 'good', label: 'Good — standard outdoor care', score: 4 };
  return { key: 'good', label: 'Good', score: 4 };
}
