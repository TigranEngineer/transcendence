export async function authMiddleware(request: any, reply: any) {
  try {
    const token = request.headers.authorization?.replace('Bearer ', '');
    if (!token) throw new Error('No token provided');
    const decoded = await request.server.jwt.verify(token);
    request.user = decoded;
  } catch (err) {
    reply.status(401).send({ error: 'Unauthorized' });
  }
}