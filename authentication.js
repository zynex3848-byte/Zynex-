const SESSION_MS = 8 * 60 * 60 * 1000;
const COOKIE = "zynex_admin_session";

function hex(bytes) { return [...new Uint8Array(bytes)].map(x => x.toString(16).padStart(2,"0")).join(""); }
async function sha(value) {
  return hex(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value)));
}
function token() { return hex(crypto.getRandomValues(new Uint8Array(32))); }
function cookieToken(request) {
  const raw = request.headers.get("Cookie") || "";
  const part = raw.split(";").map(x => x.trim()).find(x => x.startsWith(COOKIE + "="));
  return part ? decodeURIComponent(part.slice(COOKIE.length + 1)) : "";
}
export async function login(request, env) {
  if (!env.ADMIN_PASSWORD) throw new Error("ADMIN_PASSWORD_NOT_CONFIGURED");
  const body = await request.json().catch(() => ({}));
  const supplied = String(body.password || "");
  const expected = String(env.ADMIN_PASSWORD);
  const a = new TextEncoder().encode(supplied), b = new TextEncoder().encode(expected);
  let diff = a.length ^ b.length;
  for (let i=0;i<Math.max(a.length,b.length);i++) diff |= (a[i]||0) ^ (b[i]||0);
  if (!supplied || diff !== 0) return { ok:false };
  const raw = token(), hash = await sha(raw);
  const expires = new Date(Date.now()+SESSION_MS).toISOString();
  await env.DB.prepare("INSERT INTO admin_sessions(token_hash,expires_at) VALUES(?,?)").bind(hash,expires).run();
  return { ok:true, cookie:`${COOKIE}=${encodeURIComponent(raw)}; HttpOnly; Secure; SameSite=Strict; Path=/api/admin; Max-Age=${SESSION_MS/1000}` };
}
export async function isAdmin(request, env) {
  try {
    const raw = cookieToken(request);
    if (!raw || !env.DB) return false;
    const hash = await sha(raw);
    const row = await env.DB.prepare("SELECT id,expires_at FROM admin_sessions WHERE token_hash=?").bind(hash).first();
    if (!row || Date.parse(row.expires_at) <= Date.now()) {
      if (row) await env.DB.prepare("DELETE FROM admin_sessions WHERE id=?").bind(row.id).run();
      return false;
    }
    await env.DB.prepare("UPDATE admin_sessions SET last_activity=CURRENT_TIMESTAMP WHERE id=?").bind(row.id).run();
    return true;
  } catch { return false; }
}
export async function logout(request, env) {
  const raw = cookieToken(request);
  if (raw) await env.DB.prepare("DELETE FROM admin_sessions WHERE token_hash=?").bind(await sha(raw)).run();
  return `${COOKIE}=; HttpOnly; Secure; SameSite=Strict; Path=/api/admin; Max-Age=0`;
}
