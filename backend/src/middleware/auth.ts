import type { MiddlewareHandler } from "hono";
import { jwtVerify, createRemoteJWKSet, type JWTPayload } from "jose";
import { neon } from "@neondatabase/serverless";
import type { Bindings } from "../types";

type Variables = {
  user: JWTPayload;
};

let jwks: ReturnType<typeof createRemoteJWKSet> | null = null;

export const requireAuth: MiddlewareHandler<{ Bindings: Bindings; Variables: Variables }> = async (
  c,
  next,
) => {
  const authHeader = c.req.header("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return c.json({ error: "No autorizado" }, 401);
  }
  const token = authHeader.slice(7);

  if (!jwks) {
    jwks = createRemoteJWKSet(new URL(c.env.NEON_JWKS_URL));
  }

  try {
    const { payload } = await jwtVerify(token, jwks);

    const email = payload.email as string;
    const sql = neon(c.env.DATABASE_URL);
    const rows = await sql`SELECT 1 FROM allowed_emails WHERE email = ${email}`;

    if (rows.length === 0) {
      return c.json({ error: "No autorizado para usar esta aplicación" }, 403);
    }

    c.set("user", payload);
    await next();
  } catch {
    return c.json({ error: "Token inválido" }, 401);
  }
};
