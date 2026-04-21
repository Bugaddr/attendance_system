import jwt from '@tsndr/cloudflare-worker-jwt';

async function verifyPassword(password, storedHash) {
  const [saltHex, hashHex] = storedHash.split(':');
  const salt = new Uint8Array(saltHex.match(/.{1,2}/g).map(byte => parseInt(byte, 16)));
  
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    enc.encode(password),
    { name: 'PBKDF2' },
    false,
    ['deriveBits', 'deriveKey']
  );
  
  const key = await crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt,
      iterations: 100000,
      hash: 'SHA-256'
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    true,
    ['encrypt', 'decrypt']
  );

  const exportedKey = await crypto.subtle.exportKey('raw', key);
  const computedHashHex = Array.from(new Uint8Array(exportedKey)).map(b => b.toString(16).padStart(2, '0')).join('');
  
  return hashHex === computedHashHex;
}

export async function onRequest(context) {
  const { request, env } = context;
  const db = env.DB;
  const JWT_SECRET = env.JWT_SECRET || 'super-secret-key-for-dev';

  if (request.method !== 'POST') return Response.json({ error: 'Method not allowed' }, { status: 405 });

  try {
    const { email, password } = await request.json();
    
    const user = await db.prepare('SELECT * FROM Users WHERE email = ?').bind(email).first();
    if (!user) return Response.json({ error: 'Invalid email or password' }, { status: 401 });

    const isValid = await verifyPassword(password, user.passwordHash);
    if (!isValid) return Response.json({ error: 'Invalid email or password' }, { status: 401 });

    // Generate JWT
    const token = await jwt.sign({
      id: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
      studentId: user.studentId
    }, JWT_SECRET, { expiresIn: '7d' });

    // Set HTTP-Only Cookie
    const headers = new Headers();
    headers.append('Set-Cookie', `token=${token}; HttpOnly; Secure; Path=/; Max-Age=${7*24*60*60}; SameSite=Strict`);
    headers.append('Content-Type', 'application/json');

    return new Response(JSON.stringify({
      success: true,
      user: { id: user.id, email: user.email, role: user.role, name: user.name, studentId: user.studentId }
    }), { status: 200, headers });

  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}
