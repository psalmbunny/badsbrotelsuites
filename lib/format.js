// Shared helpers for turning DB rows into the JSON shape the frontend expects.

export function fmtTicket(row, logs) {
  return {
    id: 'HTL-' + String(row.id).padStart(4, '0'),
    title: row.title,
    description: row.description || '',
    room: row.room || '',
    category: row.category,
    priority: row.priority,
    status: row.status,
    reporter: row.reporter || '',
    assignee: row.assignee || '',
    guest: row.guest || '',
    dueAt: row.due_at ? new Date(row.due_at).getTime() : null,
    createdAt: new Date(row.created_at).getTime(),
    updatedAt: new Date(row.updated_at).getTime(),
    log: (logs || []).map((l) => ({ text: l.text, ts: new Date(l.ts).getTime() }))
  };
}

// Ticket ids are shown to users as "HTL-0007" but stored as a plain integer.
export function parseTicketId(raw) {
  const m = String(raw).match(/(\d+)/);
  return m ? parseInt(m[1], 10) : null;
}
