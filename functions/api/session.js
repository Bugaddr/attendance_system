import jwt from '@tsndr/cloudflare-worker-jwt';

function parseCookies(cookieHeader) {
  if (!cookieHeader) return {};
  return cookieHeader.split(';').reduce((acc, cookie) => {
    const [key, value] = cookie.split('=').map(c => c.trim());
    acc[key] = value;
    return acc;
  }, {});
}

function generateJoinCode() {
  const chars = 'abcdefghijklmnopqrstuvwxyz';
  const rand = (len) => Array.from({length: len}, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  return `${rand(3)}-${rand(4)}-${rand(3)}`;
}

export async function onRequest(context) {
  const { request, env } = context;
  const db = env.DB;
  const JWT_SECRET = env.JWT_SECRET || 'super-secret-key-for-dev';

  const cookies = parseCookies(request.headers.get('Cookie'));
  const token = cookies['token'];
  if (!token || !(await jwt.verify(token, JWT_SECRET))) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  const { payload } = jwt.decode(token);
  if (payload.role !== 'teacher') return Response.json({ error: 'Only teachers can create sessions' }, { status: 403 });

  if (request.method === 'POST') {
    try {
      const { lat, lng } = await request.json();
      const sessionId = generateJoinCode();
      await db.prepare('INSERT INTO Sessions (id, teacherId, teacherLat, teacherLng) VALUES (?, ?, ?, ?)')
        .bind(sessionId, payload.id, lat, lng)
        .run();
      return Response.json({ id: sessionId, lat, lng, createdAt: new Date().toISOString() });
    } catch (e) {
      return Response.json({ error: e.message }, { status: 500 });
    }
  }

  if (request.method === 'DELETE') {
    try {
      const url = new URL(request.url);
      const sessionId = url.searchParams.get('sessionId');
      if (!sessionId) return Response.json({ error: 'Missing sessionId' }, { status: 400 });

      const session = await db.prepare('SELECT id FROM Sessions WHERE id = ? AND teacherId = ?')
        .bind(sessionId, payload.id)
        .first();
        
      if (!session) return Response.json({ error: 'Session not found or unauthorized' }, { status: 404 });

      await db.prepare('DELETE FROM AttendanceRecords WHERE sessionId = ?').bind(sessionId).run();
      await db.prepare('DELETE FROM Sessions WHERE id = ?').bind(sessionId).run();

      return Response.json({ success: true });
    } catch (e) {
      return Response.json({ error: e.message }, { status: 500 });
    }
  }

  if (request.method === 'PUT') {
    try {
      const { sessionId } = await request.json();
      await db.prepare('UPDATE Sessions SET endedAt = CURRENT_TIMESTAMP WHERE id = ? AND teacherId = ?')
        .bind(sessionId, payload.id)
        .run();
      return Response.json({ success: true });
    } catch (e) {
      return Response.json({ error: e.message }, { status: 500 });
    }
  }

  return Response.json({ error: 'Method not allowed' }, { status: 405 });
}
