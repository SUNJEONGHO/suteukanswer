import { NextResponse } from 'next/server';
import { sql, initDb } from '@/lib/db';

export async function GET(request: Request) {
  try {
    await initDb();
    const { searchParams } = new URL(request.url);
    const subject = searchParams.get('subject');

    let result;
    if (subject) {
      result = await sql`
        SELECT DISTINCT chapter FROM problems 
        WHERE subject = ${subject}
        ORDER BY chapter ASC
      `;
    } else {
      result = await sql`
        SELECT DISTINCT chapter FROM problems 
        ORDER BY chapter ASC
      `;
    }

    const chapters = result.rows.map(row => row.chapter);

    return NextResponse.json({ chapters });
  } catch (error: any) {
    console.error('Error in GET /api/chapters:', error);
    return NextResponse.json(
      { error: error.message || String(error) },
      { status: 500 }
    );
  }
}
