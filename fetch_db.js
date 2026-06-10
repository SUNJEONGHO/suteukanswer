const { sql } = require('@vercel/postgres');
sql.connectionString = "postgresql://neondb_owner:npg_6WcQo4kRpPtq@ep-proud-tooth-aphik1iu-pooler.c-7.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require";
async function run() {
  const res = await sql`SELECT content_html FROM problems ORDER BY id DESC LIMIT 1`;
  const fs = require('fs');
  fs.writeFileSync('test.html', res.rows[0].content_html);
  console.log("Success!");
}
run().catch(console.error);
