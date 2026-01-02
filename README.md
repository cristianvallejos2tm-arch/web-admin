<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/1FPAy116ijeAerAJwx63101edsz19DcKK

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

## Procesar correos pendientes

Cuando se crea una capacitación y se seleccionan destinatarios, el sistema escribe los mensajes en la tabla `email_outbox`. Para despacharlos necesitas un worker que lea esa cola y use un proveedor SMTP.

1. Asegurate de tener estas variables de entorno disponibles (pueden residir en `.env.local` o exportarse en el entorno de ejecución):
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY` (necesario para actualizar la tabla `email_outbox`)
   - `EMAIL_SMTP_HOST`
   - `EMAIL_SMTP_PORT` (opcional, default `587`)
   - `EMAIL_SMTP_SECURE` (`true` para TLS, `false` por defecto)
   - `EMAIL_SMTP_USER` y `EMAIL_SMTP_PASSWORD` (si tu SMTP requiere autenticación)
   - `EMAIL_FROM` (dirección remitente)

2. Ejecuta el worker:
   `npm run process-email-queue`

El script toma los primeros mensajes pendientes, intenta enviarlos y actualiza el estado a `SENT` o `FAILED`. Puedes programarlo con cron o un job en tu proveedor para que se ejecute periódicamente.
