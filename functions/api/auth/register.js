import jwt from '@tsndr/cloudflare-worker-jwt';

// Helper to hash passwords securely using Web Crypto
async function hashPassword(password) {
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    enc.encode(password),
    { name: 'PBKDF2' },
    false,
    ['deriveBits', 'deriveKey']
  );
  
  const salt = crypto.getRandomValues(new Uint8Array(16));
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
  const hashBuffer = new Uint8Array(exportedKey);
  const hashArray = Array.from(hashBuffer);
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  const saltHex = Array.from(salt).map(b => b.toString(16).padStart(2, '0')).join('');
  
  return `${saltHex}:${hashHex}`;
}

export async function onRequest(context) {
  const { request, env } = context;
  const db = env.DB;

  if (request.method !== 'POST') return Response.json({ error: 'Method not allowed' }, { status: 405 });

  try {
    const { email, password, role, name, studentId } = await request.json();
    if (!email || !password || !role || !name) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const passwordHash = await hashPassword(password);
    const id = crypto.randomUUID();

    await db.prepare('INSERT INTO Users (id, email, passwordHash, role, name, studentId) VALUES (?, ?, ?, ?, ?, ?)')
      .bind(id, email, passwordHash, role, name, studentId || null)
      .run();

    return Response.json({ success: true, message: 'User registered successfully' });
  } catch (e) {
    if (e.message.includes('UNIQUE constraint failed')) {
      return Response.json({ error: 'Email already exists' }, { status: 400 });
    }
    return Response.json({ error: e.message }, { status: 500 });
  }
}
