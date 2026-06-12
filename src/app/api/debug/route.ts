import { initDb, sql } from '@/lib/db';

export async function GET() {
  await initDb();
  const res = await sql`SELECT id, content_html FROM problems ORDER BY id ASC LIMIT 5`;
  return new Response(JSON.stringify(res.rows, null, 2), {
    headers: { 'content-type': 'application/json' }
  });
}
