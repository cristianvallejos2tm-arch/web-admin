import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const json = (status: number, payload: unknown) =>
  new Response(JSON.stringify(payload), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });

const normalizePlate = (value: string | null | undefined) =>
  (value || '').toUpperCase().replace(/[^A-Z0-9]/g, '');

const toNullableNumber = (value: unknown): number | null => {
  if (value === null || value === undefined || value === '') return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return json(405, { error: 'Method not allowed' });
  }

  const apiToken = Deno.env.get('MAXTRACKER_TOKEN') || '';
  const apiBaseUrl = Deno.env.get('MAXTRACKER_BASE_URL') || 'https://app.maxtracker.com';

  if (!apiToken) {
    return json(500, { error: 'MAXTRACKER_TOKEN is not configured' });
  }

  let body: { date?: string; plate?: string; speed?: number } = {};
  try {
    body = await req.json();
  } catch {
    body = {};
  }

  const date = body.date?.trim();
  const plate = body.plate?.trim();
  const speed = typeof body.speed === 'number' ? body.speed : undefined;

  const params = new URLSearchParams();
  params.set('token', apiToken);
  if (date) params.set('date', date);
  if (plate) params.set('plate', plate);
  if (typeof speed === 'number') params.set('speed', String(speed));

  const endpoint = `${apiBaseUrl.replace(/\/$/, '')}/api/v1/positions?${params.toString()}`;

  let upstream: Response;
  try {
    upstream = await fetch(endpoint, {
      method: 'GET',
      headers: { Accept: 'application/json' },
    });
  } catch (err) {
    return json(502, { error: 'Failed to reach MaxTracker', details: String(err) });
  }

  if (upstream.status === 401) {
    return json(401, { error: 'Unauthorized in MaxTracker (token invalid)' });
  }

  if (upstream.status === 404) {
    return json(200, []);
  }

  if (!upstream.ok) {
    const details = await upstream.text();
    return json(502, {
      error: 'MaxTracker request failed',
      status: upstream.status,
      details,
    });
  }

  let raw: unknown;
  try {
    raw = await upstream.json();
  } catch {
    return json(502, { error: 'Invalid JSON response from MaxTracker' });
  }

  const rows = Array.isArray(raw)
    ? raw
    : Array.isArray((raw as { data?: unknown[] })?.data)
      ? ((raw as { data: unknown[] }).data)
      : [];

  const normalized = rows
    .map((row) => {
      const r = row as Record<string, unknown>;
      const rawPlate = (r.plate as string | undefined) || (r.patente as string | undefined);
      return {
        plate: normalizePlate(rawPlate),
        odometer: toNullableNumber(r.odometer),
        hourmeter: toNullableNumber(r.hourmeter),
        date: (r.date as string | undefined) || (r.timestamp as string | undefined) || null,
      };
    })
    .filter((row) => row.plate);

  return json(200, normalized);
});
