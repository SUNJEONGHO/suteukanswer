import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';

const dbName = 'math_platform';
const collectionName = 'problems';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const subject = searchParams.get('subject');

    const client = await clientPromise;
    const db = client.db(dbName);
    const collection = db.collection(collectionName);

    const query = subject ? { subject } : {};
    const chapters = await collection.distinct('chapter', query);

    return NextResponse.json({ chapters });
  } catch (error) {
    console.error('Error in GET /api/chapters:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
