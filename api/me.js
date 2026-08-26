import { requireAuth } from '../lib/auth.js';

// Lightweight endpoint the frontend calls to confirm a stored token is
// still valid, and to detect "online but logged out" vs "offline".
export default function handler(req, res) {
  const user = requireAuth(req, res);
  if (!user) return;
  res.status(200).json({ user: { id: user.id, name: user.name, department: user.department, username: user.username } });
}
