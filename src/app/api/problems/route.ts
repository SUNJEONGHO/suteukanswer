import { NextResponse } from 'next/server';
import { sql, initDb } from '@/lib/db';

export async function POST(request: Request) {
  try {
    await initDb();
    const data = await request.json();
    const { id, subject, chapter, problemNumber, contentHtml, description } = data;

    if (!subject || !chapter || !problemNumber || !contentHtml) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // If explicit ID is provided, update by ID (supports modifying key fields)
    if (id) {
      const parsedId = Number(id);
      if (isNaN(parsedId)) {
        return NextResponse.json({ error: 'Invalid id format' }, { status: 400 });
      }

      await sql`
        UPDATE problems 
        SET subject = ${subject}, 
            chapter = ${chapter}, 
            problem_number = ${Number(problemNumber)}, 
            description = ${description || ''}, 
            content_html = ${contentHtml}, 
            updated_at = NOW() 
        WHERE id = ${parsedId}
      `;
      return NextResponse.json({ message: 'Problem updated successfully' }, { status: 200 });
    }

    // Check if problem already exists with same key fields
    const existingResult = await sql`
      SELECT id FROM problems 
      WHERE subject = ${subject} 
        AND chapter = ${chapter} 
        AND problem_number = ${Number(problemNumber)}
    `;

    if (existingResult.rows.length > 0) {
      const existingId = existingResult.rows[0].id;
      // Update description and contentHtml
      await sql`
        UPDATE problems 
        SET description = ${description || ''}, 
            content_html = ${contentHtml}, 
            updated_at = NOW() 
        WHERE id = ${existingId}
      `;
      return NextResponse.json({ message: 'Problem updated successfully' }, { status: 200 });
    }

    // Insert new problem
    const insertResult = await sql`
      INSERT INTO problems (subject, chapter, problem_number, description, content_html) 
      VALUES (${subject}, ${chapter}, ${Number(problemNumber)}, ${description || ''}, ${contentHtml})
      RETURNING id
    `;

    return NextResponse.json(
      { message: 'Problem created successfully', id: insertResult.rows[0].id.toString() },
      { status: 201 }
    );
  } catch (err: unknown) {
    console.error('Error in POST /api/problems:', err);
    const error = err as Error;
    return NextResponse.json(
      { error: error.message || String(err) },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  try {
    await initDb();
    const { searchParams } = new URL(request.url);
    const subject = searchParams.get('subject');
    const chapter = searchParams.get('chapter');
    const problemNumber = searchParams.get('problemNumber');
    const id = searchParams.get('id');

    if (id) {
      const parsedId = Number(id);
      if (isNaN(parsedId)) {
        return NextResponse.json({ error: 'Invalid id format' }, { status: 400 });
      }

      const result = await sql`SELECT * FROM problems WHERE id = ${parsedId}`;
      if (result.rows.length === 0) {
        return NextResponse.json({ error: 'Not found' }, { status: 404 });
      }
      
      const row = result.rows[0];
      return NextResponse.json({
        _id: row.id.toString(),
        id: row.id,
        subject: row.subject,
        chapter: row.chapter,
        problemNumber: row.problem_number,
        description: row.description,
        contentHtml: row.content_html,
        views: row.views || 0,
        createdAt: row.created_at,
        updatedAt: row.updated_at
      });
    }

    let result;
    const search = searchParams.get('search');
    
    if (search) {
      const searchPattern = `%${search}%`;
      // Search across description, subject, and chapter, or if it's a number, match problem_number
      const searchNum = Number(search);
      if (!isNaN(searchNum)) {
        result = await sql`
          SELECT * FROM problems 
          WHERE subject ILIKE ${searchPattern} 
             OR chapter ILIKE ${searchPattern} 
             OR description ILIKE ${searchPattern}
             OR problem_number = ${searchNum}
          ORDER BY problem_number ASC
        `;
      } else {
        result = await sql`
          SELECT * FROM problems 
          WHERE subject ILIKE ${searchPattern} 
             OR chapter ILIKE ${searchPattern} 
             OR description ILIKE ${searchPattern}
          ORDER BY subject ASC, chapter ASC, problem_number ASC
        `;
      }
    } else if (subject && chapter && problemNumber) {
      result = await sql`
        SELECT * FROM problems 
        WHERE subject = ${subject} 
          AND chapter = ${chapter} 
          AND problem_number = ${Number(problemNumber)} 
        ORDER BY problem_number ASC
      `;
    } else if (subject && chapter) {
      result = await sql`
        SELECT * FROM problems 
        WHERE subject = ${subject} 
          AND chapter = ${chapter} 
        ORDER BY problem_number ASC
      `;
    } else if (subject) {
      result = await sql`
        SELECT * FROM problems 
        WHERE subject = ${subject} 
        ORDER BY problem_number ASC
      `;
    } else {
      result = await sql`
        SELECT * FROM problems 
        ORDER BY subject ASC, chapter ASC, problem_number ASC
      `;
    }

    const problems = result.rows.map(row => ({
      _id: row.id.toString(),
      id: row.id,
      subject: row.subject,
      chapter: row.chapter,
      problemNumber: row.problem_number,
      description: row.description,
      contentHtml: row.content_html,
      views: row.views || 0,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    }));

    return NextResponse.json({ problems });
  } catch (err: unknown) {
    console.error('Error in GET /api/problems:', err);
    const error = err as Error;
    return NextResponse.json(
      { error: error.message || String(err) },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    await initDb();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Missing id' }, { status: 400 });
    }

    const parsedId = Number(id);
    if (isNaN(parsedId)) {
      return NextResponse.json({ error: 'Invalid id format' }, { status: 400 });
    }

    const result = await sql`
      DELETE FROM problems 
      WHERE id = ${parsedId}
    `;

    // Note: pg doesn't return deletedCount directly, but rowCount tells how many rows were affected
    if (result.rowCount === 0) {
      return NextResponse.json({ error: 'Problem not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Problem deleted successfully' });
  } catch (err: unknown) {
    console.error('Error in DELETE /api/problems:', err);
    const error = err as Error;
    return NextResponse.json(
      { error: error.message || String(err) },
      { status: 500 }
    );
  }
}
