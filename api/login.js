import bcrypt from 'bcryptjs';
import { sql } from '../lib/db.js';
import { signToken } from '../lib/auth.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { username, password } = req.body || {};
  if (!username || !password) {
    return res.status(400).json({ error: 'Enter a username and password.' });
  }

  try {
    const result = await sql`SELECT * FROM users WHERE lower(username) = lower(${username})`;
    const row = result.rows[0];
    if (!row) return res.status(401).json({ error: 'No account with that username.' });

    const ok = await bcrypt.compare(password, row.password_hash);
    if (!ok) return res.status(401).json({ error: 'Incorrect password.' });

    const user = { id: row.id, name: row.name, department: row.department, username: row.username };
    const token = signToken(user);
    res.status(200).json({ token, user });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Server error logging in.' });
  }
}
