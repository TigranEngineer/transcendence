declare module '@fastify/cors' {
    import { FastifyPluginAsync } from 'fastify';
  
    const cors: FastifyPluginAsync<{
      origin?: string | string[] | ((origin: string, cb: (err: Error | null, allow?: boolean) => void) => void);
      methods?: string | string[];
      allowedHeaders?: string | string[];
      credentials?: boolean;
    }>;
  
    export default cors;
  }