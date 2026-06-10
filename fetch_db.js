const { sql } = require('@vercel/postgres');
require('dotenv').config({path: '.env.local'});
async function run() {
  const res = await sql`SELECT content_html FROM problems ORDER BY id DESC LIMIT 1`;
  const fs = require('fs');
  fs.writeFileSync('latest_html.txt', res.rows[0].content_html);
}
run();
