import { connectToDatabase } from '../../../lib/mongodb';
import { NextResponse } from 'next/server';

export async function GET() {
  const { db } = await connectToDatabase();
  const candidates = await db.collection('candidates').find().toArray();
  return NextResponse.json(candidates);
}