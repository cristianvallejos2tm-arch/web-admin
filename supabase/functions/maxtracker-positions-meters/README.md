# maxtracker-positions-meters

Edge Function para consultar `GET /api/v1/positions` de MaxTracker y devolver solo:
- `plate`
- `odometer`
- `hourmeter`
- `date`

## Variables de entorno requeridas
- `MAXTRACKER_TOKEN`: token de acceso de MaxTracker.
- `MAXTRACKER_BASE_URL` (opcional): por defecto `https://app.maxtracker.com`.

## Request (desde frontend)
```json
{
  "date": "2026-02-10",
  "plate": "ABC123"
}
```

Todos los campos son opcionales.

## Respuesta
```json
[
  {
    "plate": "ABC123",
    "odometer": 1500,
    "hourmeter": 120,
    "date": "2023-10-01 12:34:56"
  }
]
```

## Deploy
```bash
supabase functions deploy maxtracker-positions-meters
```

## Set secrets
```bash
supabase secrets set MAXTRACKER_TOKEN=tu_token
supabase secrets set MAXTRACKER_BASE_URL=https://app.maxtracker.com
```
