import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';

export async function GET() {
  try {
    const client = await clientPromise;
    const db = client.db('math_platform');
    // Ping the database to verify active connection
    await db.command({ ping: 1 });
    
    // Count documents in the problems collection
    const count = await db.collection('problems').countDocuments();
    
    return NextResponse.json({
      status: 'success',
      message: 'Successfully connected to MongoDB',
      problemsCount: count,
      envUriExists: !!process.env.MONGODB_URI,
    });
  } catch (error: any) {
    console.error('Database connection test failed:', error);
    return NextResponse.json({
      status: 'error',
      message: 'Failed to connect to MongoDB',
      error: error.message || String(error),
      envUriExists: !!process.env.MONGODB_URI,
      envUriPreview: process.env.MONGODB_URI
        ? `${process.env.MONGODB_URI.substring(0, 15)}...`
        : 'none',
    }, { status: 500 });
  }
}
