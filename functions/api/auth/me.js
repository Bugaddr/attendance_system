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
  const JWT_SECRET = env.JWT_SECRET || 'super-secret-key-for-dev';

  if (request.method !== 'GET') return Response.json({ error: 'Method not allowed' }, { status: 405 });

  try {
    const cookies = parseCookies(request.headers.get('Cookie'));
    const token = cookies['token'];

    if (!token) return Response.json({ error: 'Not authenticated' }, { status: 401 });

    const isValid = await jwt.verify(token, JWT_SECRET);
    if (!isValid) return Response.json({ error: 'Invalid token' }, { status: 401 });

    const { payload } = jwt.decode(token);
    
    return Response.json({ user: payload });
  } catch (e) {
    return Response.json({ error: 'Authentication failed' }, { status: 401 });
  }
}
