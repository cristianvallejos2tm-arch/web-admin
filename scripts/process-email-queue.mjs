import 'dotenv/config';
import nodemailer from 'nodemailer';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;
const fromAddress = process.env.EMAIL_FROM;
const smtpHost = process.env.EMAIL_SMTP_HOST;
const smtpPort = Number(process.env.EMAIL_SMTP_PORT ?? 587);
const smtpSecure = (process.env.EMAIL_SMTP_SECURE ?? 'false') === 'true';
const batchSize = Number(process.env.EMAIL_QUEUE_BATCH_SIZE ?? 20);

if (!supabaseUrl || !supabaseKey) {
  console.error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required');
  process.exit(1);
}

if (!fromAddress) {
  console.error('EMAIL_FROM is required');
  process.exit(1);
}

if (!smtpHost) {
  console.error('EMAIL_SMTP_HOST is required');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const transporter = nodemailer.createTransport({
  host: smtpHost,
  port: smtpPort,
  secure: smtpSecure,
  auth:
    process.env.EMAIL_SMTP_USER && process.env.EMAIL_SMTP_PASSWORD
      ? {
          user: process.env.EMAIL_SMTP_USER,
          pass: process.env.EMAIL_SMTP_PASSWORD,
        }
      : undefined,
});

const processQueue = async () => {
  const { data, error } = await supabase
    .from('email_outbox')
    .select('*')
    .eq('status', 'PENDING')
    .order('created_at', { ascending: true })
    .limit(batchSize);

  if (error) {
    console.error('Error leyendo cola de emails:', error);
    process.exit(1);
  }

  if (!data || data.length === 0) {
    console.log('No hay emails pendientes');
    return;
  }

  for (const entry of data) {
    const mailOptions = {
      from: fromAddress,
      to: entry.to_email,
      subject: entry.subject,
      html: entry.body,
      attachments: entry.attachment_url
        ? [
            {
              filename: entry.attachment_name ?? 'attachment',
              path: entry.attachment_url,
              contentType: entry.attachment_mime ?? undefined,
            },
          ]
        : undefined,
    };

    try {
      await transporter.sendMail(mailOptions);
      await supabase
        .from('email_outbox')
        .update({
          status: 'SENT',
          attempts: (entry.attempts ?? 0) + 1,
          last_error: null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', entry.id);
      console.log(`Email enviado a ${entry.to_email}`);
    } catch (err) {
      console.error(`No se pudo enviar a ${entry.to_email}:`, err);
      await supabase
        .from('email_outbox')
        .update({
          status: 'FAILED',
          attempts: (entry.attempts ?? 0) + 1,
          last_error: err instanceof Error ? err.message : JSON.stringify(err),
          updated_at: new Date().toISOString(),
        })
        .eq('id', entry.id);
    }
  }
};

processQueue()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Fallo procesando la cola de emails', error);
    process.exit(1);
  });
