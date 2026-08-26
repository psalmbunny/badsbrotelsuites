import { sql } from '../../lib/db.js';
import { requireAuth } from '../../lib/auth.js';
import { fmtTicket } from '../../lib/format.js';

export default async function handler(req, res) {
  const user = requireAuth(req, res);
  if (!user) return;

  if (req.method === 'GET') {
    try {
      const tickets = await sql`SELECT * FROM tickets ORDER BY updated_at DESC`;
      const logs = await sql`SELECT * FROM ticket_logs ORDER BY ts ASC`;
      const logsByTicket = {};
      logs.rows.forEach((l) => {
        (logsByTicket[l.ticket_id] = logsByTicket[l.ticket_id] || []).push(l);
      });
      const out = tickets.rows.map((t) => fmtTicket(t, logsByTicket[t.id]));
      return res.status(200).json(out);
    } catch (e) {
      console.error(e);
      return res.status(500).json({ error: 'Server error loading tickets.' });
    }
  }

  if (req.method === 'POST') {
    const b = req.body || {};
    if (!b.title || !b.title.trim()) return res.status(400).json({ error: 'Title is required.' });
    try {
      const dueAt = b.dueAt ? new Date(b.dueAt) : null;
      const result = await sql`
        INSERT INTO tickets (title, description, room, category, priority, status, reporter, assignee, guest, due_at)
        VALUES (${b.title}, ${b.description || ''}, ${b.room || ''}, ${b.category || 'Other'},
                ${b.priority || 'Medium'}, ${b.status || 'Open'}, ${b.reporter || ''},
                ${b.assignee || ''}, ${b.guest || ''}, ${dueAt})
        RETURNING *
      `;
      const row = result.rows[0];
      await sql`INSERT INTO ticket_logs (ticket_id, text) VALUES (${row.id}, 'Ticket created.')`;
      const logs = await sql`SELECT * FROM ticket_logs WHERE ticket_id = ${row.id} ORDER BY ts ASC`;
      return res.status(201).json(fmtTicket(row, logs.rows));
    } catch (e) {
      console.error(e);
      return res.status(500).json({ error: 'Server error creating ticket.' });
    }
  }

  res.status(405).json({ error: 'Method not allowed' });
}
