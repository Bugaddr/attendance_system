import jwt from '@tsndr/cloudflare-worker-jwt';

function parseCookies(cookieHeader) {
  if (!cookieHeader) return {};
  return cookieHeader.split(';').reduce((acc, cookie) => {
    const [key, value] = cookie.split('=').map(c => c.trim());
    acc[key] = value;
    return acc;
  }, {});
}

export async function onRequest(context) {
  const { request, env } = context;
  const db = env.DB;
  const JWT_SECRET = env.JWT_SECRET || 'super-secret-key-for-dev';

  if (request.method !== 'GET') return Response.json({ error: 'Method not allowed' }, { status: 405 });

  const cookies = parseCookies(request.headers.get('Cookie'));
  const token = cookies['token'];
  if (!token || !(await jwt.verify(token, JWT_SECRET))) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  const { payload } = jwt.decode(token);
  if (payload.role !== 'teacher') return Response.json({ error: 'Only teachers can view session history' }, { status: 403 });

  try {
    const { results } = await db.prepare(`
      SELECT 
        s.id, s.createdAt, s.endedAt, 
        (SELECT COUNT(*) FROM AttendanceRecords a WHERE a.sessionId = s.id) as attendeeCount
      FROM Sessions s
      WHERE s.teacherId = ?
      ORDER BY s.createdAt DESC
    `).bind(payload.id).all();
    
    return Response.json(results || []);
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}
