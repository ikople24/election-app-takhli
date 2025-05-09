import { connectToDatabase } from '../../../lib/mongodb';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { id, name } = await req.json();

    if (!id || !name) {
      return NextResponse.json({ message: 'Missing id or name' }, { status: 400 });
    }

    const { db } = await connectToDatabase();

    const result = await db.collection('candidates').updateOne(
      { _id: new (require('mongodb').ObjectId)(id) },
      { $set: { name } }
    );

    if (result.modifiedCount === 0) {
      return NextResponse.json({ message: 'No document updated' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Name updated successfully' });
  } catch (error) {
    console.error('Error updating name:', error);
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
}