import jwt from 'jsonwebtoken';

const SECRET = process.env.JWT_SECRET;

export function signToken(user) {
  if (!SECRET) throw new Error('JWT_SECRET is not set');
  return jwt.sign(
    { id: user.id, username: user.username, name: user.name, department: user.department },
    SECRET,
    { expiresIn: '30d' }
  );
}

export function verifyToken(req) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token || !SECRET) return null;
  try {
    return jwt.verify(token, SECRET);
  } catch (e) {
    return null;
  }
}

// Returns the decoded user, or writes a 401 response and returns null.
export function requireAuth(req, res) {
  const user = verifyToken(req);
  if (!user) {
    res.status(401).json({ error: 'Unauthorized' });
    return null;
  }
  return user;
}
