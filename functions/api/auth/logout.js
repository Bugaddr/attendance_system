export async function onRequest(context) {
  const { request } = context;
  if (request.method !== 'POST') return Response.json({ error: 'Method not allowed' }, { status: 405 });

  const headers = new Headers();
  headers.append('Set-Cookie', `token=; HttpOnly; Secure; Path=/; Max-Age=0; SameSite=Strict`);
  headers.append('Content-Type', 'application/json');

  return new Response(JSON.stringify({ success: true }), { status: 200, headers });
}
