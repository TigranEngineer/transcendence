export const validateRequest = (schema: any) => {
  return async (request: any, reply: any) => {
    const validation = schema.validate(request.body);
    if (validation.error) {
      reply.status(400).send({ error: validation.error.message });
    }
  };
};