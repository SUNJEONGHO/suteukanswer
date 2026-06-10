const { sql } = require('@vercel/postgres');
sql.connectionString = "postgresql://neondb_owner:npg_6WcQo4kRpPtq@ep-proud-tooth-aphik1iu-pooler.c-7.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require";
async function run() {
  const res = await sql`SELECT content_html FROM problems WHERE content_html LIKE '%지수법칙과 자연수 조건%' LIMIT 1`;
  if (res.rows.length === 0) { console.log("Not found."); return; }
  const fs = require('fs');
  fs.writeFileSync('desmos.html', res.rows[0].content_html);
  console.log("Success! Saved to desmos.html");
}
run().catch(console.error);
