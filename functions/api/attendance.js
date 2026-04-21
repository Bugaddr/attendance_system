import jwt from '@tsndr/cloudflare-worker-jwt';

function parseCookies(cookieHeader) {
  if (!cookieHeader) return {};
  return cookieHeader.split(';').reduce((acc, cookie) => {
    const [key, value] = cookie.split('=').map(c => c.trim());
    acc[key] = value;
    return acc;
  }, {});
}

function getDistanceInMeters(lat1, lon1, lat2, lon2) {
  const R = 6371e3; // metres
  const φ1 = lat1 * Math.PI/180;
  const φ2 = lat2 * Math.PI/180;
  const Δφ = (lat2-lat1) * Math.PI/180;
  const Δλ = (lon2-lon1) * Math.PI/180;

  const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ/2) * Math.sin(Δλ/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

  return R * c; 
}

export async function onRequest(context) {
  const { request, env } = context;
  const db = env.DB;
  const JWT_SECRET = env.JWT_SECRET || 'super-secret-key-for-dev';
  const url = new URL(request.url);

  if (request.method === 'GET') {
    const cookies = parseCookies(request.headers.get('Cookie'));
    const token = cookies['token'];
    if (!token || !(await jwt.verify(token, JWT_SECRET))) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const sessionId = url.searchParams.get('sessionId');
    if (!sessionId) return Response.json({ error: 'Missing sessionId' }, { status: 400 });
    
    try {
      const { results } = await db.prepare(`
        SELECT a.*, u.name as studentName, u.studentId 
        FROM AttendanceRecords a 
        JOIN Users u ON a.studentUserId = u.id 
        WHERE a.sessionId = ? ORDER BY a.createdAt DESC
      `).bind(sessionId).all();
      return Response.json(results || []);
    } catch (e) {
      return Response.json({ error: e.message }, { status: 500 });
    }
  }

  if (request.method === 'POST') {
    try {
      const { sessionId, name, studentId, photoData, studentLat, studentLng } = await request.json();
      
      const session = await db.prepare('SELECT * FROM Sessions WHERE id = ?').bind(sessionId).first();
      if (!session) return Response.json({ error: 'Invalid session' }, { status: 404 });
      if (session.endedAt) return Response.json({ error: 'This attendance session has been closed by the teacher.' }, { status: 403 });

      const distance = getDistanceInMeters(session.teacherLat, session.teacherLng, studentLat, studentLng);
      if (distance > 50) return Response.json({ error: `You are too far from the classroom (${Math.round(distance)}m). You must be within 50 meters.` }, { status: 403 });

      // Upsert User
      let user = await db.prepare('SELECT id FROM Users WHERE studentId = ?').bind(studentId).first();
      let userId;
      if (user) {
        userId = user.id;
      } else {
        userId = crypto.randomUUID();
        await db.prepare('INSERT INTO Users (id, email, passwordHash, role, name, studentId) VALUES (?, ?, ?, ?, ?, ?)')
          .bind(userId, `${studentId}@student.local`, 'no-login', 'student', name, studentId)
          .run();
      }

      const existing = await db.prepare('SELECT id FROM AttendanceRecords WHERE sessionId = ? AND studentUserId = ?')
        .bind(sessionId, userId).first();
      if (existing) return Response.json({ error: 'Attendance already recorded for this ID.' }, { status: 400 });

      const id = crypto.randomUUID();
      await db.prepare('INSERT INTO AttendanceRecords (id, sessionId, studentUserId, photoData, studentLat, studentLng, distanceMeters) VALUES (?, ?, ?, ?, ?, ?, ?)')
        .bind(id, sessionId, userId, photoData, studentLat, studentLng, distance)
        .run();

      return Response.json({ success: true, distance });
    } catch (e) {
      return Response.json({ error: e.message }, { status: 500 });
    }
  }

  return Response.json({ error: 'Method not allowed' }, { status: 405 });
}
