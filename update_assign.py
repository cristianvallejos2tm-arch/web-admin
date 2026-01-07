# -*- coding: utf-8 -*-
from pathlib import Path
path = Path('components/Capacitaciones.tsx')
text = path.read_text()
needle = 'const assignAndNotifyUsuarios = async (capacitacionId: string) => {'
start = text.index(needle)
idx = start + len(needle)
balance = 1
while idx < len(text) and balance > 0:
    c = text[idx]
    if c == '{':
        balance += 1
    elif c == '}':
        balance -= 1
    idx += 1
end = idx
new_block = """const assignAndNotifyUsuarios = async (capacitacionId: string) => {
    if (selectedUsuarioIds.length === 0) return;
    const assignedUsers = usuariosCatalogo.filter((user) => selectedUsuarioIds.includes(user.id));
    if (assignedUsers.length === 0) return;

    const { error: inscripcionesError } = await insertCapacitacionInscripciones(
        capacitacionId,
        assignedUsers.map((user) => user.id),
    );
    if (inscripcionesError) {
        console.error('Error registrando inscripciones de capacitacion', inscripcionesError);
    }

    const contextText = [intro, description].filter(Boolean).join(' ');
    const portalUrl = `${window.location.origin}/capacitaciones/${capacitacionId}`;
    const attachmentLinks = attachments
        .filter((item) => item.url)
        .map((item) => `<li><a href="${item.url}">${item.name or 'Archivo adjunto'}</a></li>`)
        .join('');
    const attachmentSection = attachmentLinks ? `<p>Descargá el material de referencia:</p><ul>${attachmentLinks}</ul>` : '';
    const videoSection = videoLink
        ? `<p>Miralo en video: <a href="${videoLink}">${videoLink}</a></p>`
        : '';
    const invitationEntries = assignedUsers
        .filter((user) => user.email)
        .map((user) => ({
            to_email: user.email,
            subject: `Nueva capacitaciИn: ${title}`,
            body: `
                <p>Hola ${user.nombre ?? 'colaborador'},</p>
                <p>Se ha creado la capacitaciИn <strong>${title}</strong>.</p>
                ${contextText ? `<p>${contextText}</p>` : ''}
                <p>IngresК al portal para revisar la capacitaciИn, visualizar el video y acceder a los archivos: <a href="${portalUrl}">${portalUrl}</a></p>
                ${videoSection}
                ${attachmentSection}
                <p>Saludos,<br/>Equipo CAM</p>
            `.trim(),
        }));

    if (invitationEntries.length === 0) return;

    const { error: notificationError } = await queueCapacitacionNotifications(invitationEntries);
    if (notificationError) {
        console.error('Error enviando notificaciones de capacitacion', notificationError);
    }
};"""
path.write_text(text[:start] + new_block + text[end:], encoding='utf-8')
