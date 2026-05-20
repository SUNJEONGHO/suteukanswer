import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';

const dbName = 'math_platform';
const collectionName = 'problems';

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const { id, subject, chapter, problemNumber, contentHtml, description } = data;

    if (!subject || !chapter || !problemNumber || !contentHtml) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db(dbName);
    const collection = db.collection(collectionName);

    // If explicit ID is provided, update by ID (supports modifying key fields)
    if (id) {
      const { ObjectId } = require('mongodb');
      if (!ObjectId.isValid(id)) {
        return NextResponse.json({ error: 'Invalid id format' }, { status: 400 });
      }

      await collection.updateOne(
        { _id: new ObjectId(id) },
        {
          $set: {
            subject,
            chapter,
            problemNumber: Number(problemNumber),
            description: description || '',
            contentHtml,
            updatedAt: new Date()
          }
        }
      );
      return NextResponse.json({ message: 'Problem updated successfully' }, { status: 200 });
    }

    // Check if problem already exists with same key fields
    const existing = await collection.findOne({ subject, chapter, problemNumber: Number(problemNumber) });
    if (existing) {
       // Update description and contentHtml
       await collection.updateOne(
        { _id: existing._id },
        { $set: { description: description || '', contentHtml, updatedAt: new Date() } }
       );
       return NextResponse.json({ message: 'Problem updated successfully' }, { status: 200 });
    }

    const newProblem = {
      subject,
      chapter,
      problemNumber: Number(problemNumber),
      description: description || '',
      contentHtml,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const result = await collection.insertOne(newProblem);

    return NextResponse.json(
      { message: 'Problem created successfully', id: result.insertedId },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error in POST /api/problems:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const subject = searchParams.get('subject');
    const chapter = searchParams.get('chapter');
    const problemNumber = searchParams.get('problemNumber');
    const id = searchParams.get('id');

    const client = await clientPromise;
    const db = client.db(dbName);
    const collection = db.collection(collectionName);

    if (id) {
        const { ObjectId } = require('mongodb');
        const problem = await collection.findOne({ _id: new ObjectId(id) });
        if (!problem) return NextResponse.json({ error: 'Not found' }, { status: 404 });
        return NextResponse.json(problem);
    }

    const query: any = {};
    if (subject) query.subject = subject;
    if (chapter) query.chapter = chapter;
    if (problemNumber) query.problemNumber = Number(problemNumber);

    const problems = await collection.find(query).sort({ problemNumber: 1 }).toArray();

    return NextResponse.json({ problems });
  } catch (error) {
    console.error('Error in GET /api/problems:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Missing id' }, { status: 400 });
    }

    const { ObjectId } = require('mongodb');
    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Invalid id' }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db(dbName);
    const collection = db.collection(collectionName);

    const result = await collection.deleteOne({ _id: new ObjectId(id) });

    if (result.deletedCount === 0) {
      return NextResponse.json({ error: 'Problem not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Problem deleted successfully' });
  } catch (error) {
    console.error('Error in DELETE /api/problems:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
