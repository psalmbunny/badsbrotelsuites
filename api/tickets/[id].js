import { sql } from '../../lib/db.js';
import { requireAuth } from '../../lib/auth.js';
import { fmtTicket, parseTicketId } from '../../lib/format.js';

export default async function handler(req, res) {
  const user = requireAuth(req, res);
  if (!user) return;

  const id = parseTicketId(req.query.id);
  if (!id) return res.status(400).json({ error: 'Invalid ticket id.' });

  if (req.method === 'PATCH') {
    const b = req.body || {};
    try {
      const existing = await sql`SELECT * FROM tickets WHERE id = ${id}`;
      if (!existing.rows.length) return res.status(404).json({ error: 'Ticket not found.' });
      const cur = existing.rows[0];

      const next = {
        title: b.title !== undefined ? b.title : cur.title,
        description: b.description !== undefined ? b.description : cur.description,
        room: b.room !== undefined ? b.room : cur.room,
        category: b.category !== undefined ? b.category : cur.category,
        priority: b.priority !== undefined ? b.priority : cur.priority,
        status: b.status !== undefined ? b.status : cur.status,
        reporter: b.reporter !== undefined ? b.reporter : cur.reporter,
        assignee: b.assignee !== undefined ? b.assignee : cur.assignee,
        guest: b.guest !== undefined ? b.guest : cur.guest,
        due_at: b.dueAt !== undefined ? (b.dueAt ? new Date(b.dueAt) : null) : cur.due_at
      };

      const result = await sql`
        UPDATE tickets SET
          title = ${next.title}, description = ${next.description}, room = ${next.room},
          category = ${next.category}, priority = ${next.priority}, status = ${next.status},
          reporter = ${next.reporter}, assignee = ${next.assignee}, guest = ${next.guest},
          due_at = ${next.due_at}, updated_at = now()
        WHERE id = ${id}
        RETURNING *
      `;
      const row = result.rows[0];

      if (b.addLog) {
        await sql`INSERT INTO ticket_logs (ticket_id, text) VALUES (${id}, ${b.addLog})`;
      }
      const logs = await sql`SELECT * FROM ticket_logs WHERE ticket_id = ${id} ORDER BY ts ASC`;
      return res.status(200).json(fmtTicket(row, logs.rows));
    } catch (e) {
      console.error(e);
      return res.status(500).json({ error: 'Server error updating ticket.' });
    }
  }

  if (req.method === 'DELETE') {
    try {
      await sql`DELETE FROM tickets WHERE id = ${id}`;
      return res.status(200).json({ ok: true });
    } catch (e) {
      console.error(e);
      return res.status(500).json({ error: 'Server error deleting ticket.' });
    }
  }

  res.status(405).json({ error: 'Method not allowed' });
}
