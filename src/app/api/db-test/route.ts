import { NextResponse } from 'next/server';
import { sql, initDb } from '@/lib/db';

export async function GET() {
  try {
    await initDb();
    // Verify query connection
    const checkRes = await sql`SELECT 1 as connected`;
    
    // Count the problems in the postgres table
    const countRes = await sql`SELECT COUNT(*) FROM problems`;
    const count = Number(countRes.rows[0].count);
    
    return NextResponse.json({
      status: 'success',
      message: 'Successfully connected to Vercel Postgres',
      problemsCount: count,
      envUrlExists: !!process.env.POSTGRES_URL,
    });
  } catch (error: any) {
    console.error('Database connection test failed:', error);
    return NextResponse.json({
      status: 'error',
      message: 'Failed to connect to Vercel Postgres',
      error: error.message || String(error),
      envUrlExists: !!process.env.POSTGRES_URL,
      envUrlPreview: process.env.POSTGRES_URL
        ? `${process.env.POSTGRES_URL.substring(0, 20)}...`
        : 'none',
    }, { status: 500 });
  }
}
