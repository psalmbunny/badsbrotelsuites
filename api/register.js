import bcrypt from 'bcryptjs';
import { sql } from '../lib/db.js';
import { signToken } from '../lib/auth.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { name, department, username, password } = req.body || {};
  if (!name || !department || !username || !password) {
    return res.status(400).json({ error: 'Please fill in every field.' });
  }
  if (password.length < 6) {
    return res.status(400).json({ error: 'Password should be at least 6 characters.' });
  }

  try {
    const existing = await sql`SELECT id FROM users WHERE lower(username) = lower(${username})`;
    if (existing.rows.length) {
      return res.status(409).json({ error: 'That username is already taken.' });
    }
    const hash = await bcrypt.hash(password, 10);
    const result = await sql`
      INSERT INTO users (name, department, username, password_hash)
      VALUES (${name}, ${department}, ${username}, ${hash})
      RETURNING id, name, department, username
    `;
    const user = result.rows[0];
    const token = signToken(user);
    res.status(201).json({ token, user });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Server error creating account.' });
  }
}
