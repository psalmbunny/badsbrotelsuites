import { sql } from '../lib/db.js';
import { requireAuth } from '../lib/auth.js';

export default async function handler(req, res) {
  const user = requireAuth(req, res);
  if (!user) return;

  if (req.method === 'GET') {
    try {
      const r = await sql`SELECT notes FROM handover WHERE id = 1`;
      return res.status(200).json({ notes: r.rows[0] ? r.rows[0].notes : '' });
    } catch (e) {
      console.error(e);
      return res.status(500).json({ error: 'Server error' });
    }
  }

  if (req.method === 'PUT') {
    const { notes } = req.body || {};
    try {
      await sql`UPDATE handover SET notes = ${notes || ''}, updated_at = now() WHERE id = 1`;
      return res.status(200).json({ ok: true });
    } catch (e) {
      console.error(e);
      return res.status(500).json({ error: 'Server error' });
    }
  }

  res.status(405).json({ error: 'Method not allowed' });
}
