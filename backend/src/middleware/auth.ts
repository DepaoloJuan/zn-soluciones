import type { MiddlewareHandler } from "hono";
import { jwtVerify, createRemoteJWKSet, type JWTPayload } from "jose";
import { neon } from "@neondatabase/serverless";
import type { Bindings } from "../types";

type Variables = {
  user: JWTPayload;
};

let jwks: ReturnType<typeof createRemoteJWKSet> | null = null;

// Verifica un JWT y confirma que el email esté en allowed_emails.
// Se usa tanto en el middleware HTTP (token vía header) como en la ruta
// de voz (token vía query string, porque el WebSocket del navegador no
// puede mandar headers custom en el handshake).
export async function verifyAuthToken(
  token: string,
  env: { NEON_JWKS_URL: string; DATABASE_URL: string },
): Promise<JWTPayload> {
  if (!jwks) {
    jwks = createRemoteJWKSet(new URL(env.NEON_JWKS_URL));
  }

  const { payload } = await jwtVerify(token, jwks);

  const email = payload.email as string;
  const sql = neon(env.DATABASE_URL);
  const rows = await sql`SELECT 1 FROM allowed_emails WHERE email = ${email}`;

  if (rows.length === 0) {
    throw new Error("No autorizado para usar esta aplicación");
  }

  return payload;
}

export const requireAuth: MiddlewareHandler<{ Bindings: Bindings; Variables: Variables }> = async (
  c,
  next,
) => {
  const authHeader = c.req.header("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return c.json({ error: "No autorizado" }, 401);
  }
  const token = authHeader.slice(7);

  try {
    const payload = await verifyAuthToken(token, c.env);
    c.set("user", payload);
    await next();
  } catch (err) {
    if (err instanceof Error && err.message === "No autorizado para usar esta aplicación") {
      return c.json({ error: err.message }, 403);
    }
    return c.json({ error: "Token inválido" }, 401);
  }
};
