export function db(env) {
  if (!env.DB) throw new Error("DATABASE_NOT_CONFIGURED");
  return env.DB;
}
export async function all(env, sql, params = []) {
  const r = await db(env).prepare(sql).bind(...params).all();
  return r.results || [];
}
export async function first(env, sql, params = []) {
  return db(env).prepare(sql).bind(...params).first();
}
export async function run(env, sql, params = []) {
  return db(env).prepare(sql).bind(...params).run();
}
export async function setting(env, key, fallback = "") {
  const row = await first(env, "SELECT setting_value FROM system_settings WHERE setting_key=?", [key]);
  return row?.setting_value ?? fallback;
}
export async function setSetting(env, key, value, category = "general") {
  return run(env, `INSERT INTO system_settings(setting_key,setting_value,category,updated_at)
    VALUES(?,?,?,CURRENT_TIMESTAMP)
    ON CONFLICT(setting_key) DO UPDATE SET setting_value=excluded.setting_value,category=excluded.category,updated_at=CURRENT_TIMESTAMP`,
    [key, String(value), category]);
}
export async function knowledge(env) {
  return all(env, "SELECT title,content,knowledge_type FROM nex_knowledge WHERE is_active=1 ORDER BY sort_order,id");
}
export async function skills(env) {
  return all(env, "SELECT skill_name,skill_description,skill_instructions,skill_category FROM nex_skills WHERE is_active=1 ORDER BY id");
}
export async function services(env) {
  return all(env, "SELECT * FROM services WHERE is_active=1 ORDER BY sort_order,id");
}
