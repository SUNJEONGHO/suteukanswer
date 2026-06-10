import { NextResponse } from 'next/server';
import { sql, initDb } from '@/lib/db';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await initDb();
    const resolvedParams = await params;
    const id = Number(resolvedParams.id);
    
    if (isNaN(id)) {
      return NextResponse.json({ error: 'Invalid id format' }, { status: 400 });
    }

    // Increment views for the specific problem
    const result = await sql`
      UPDATE problems 
      SET views = COALESCE(views, 0) + 1 
      WHERE id = ${id}
      RETURNING views
    `;

    if (result.rowCount === 0) {
      return NextResponse.json({ error: 'Problem not found' }, { status: 404 });
    }

    return NextResponse.json({ views: result.rows[0].views });
  } catch (error: any) {
    console.error('Error incrementing view count:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
