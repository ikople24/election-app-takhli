// app/api/candidates/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '../../../../lib/mongodb';
import { ObjectId } from 'mongodb';

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { db } = await connectToDatabase();
    const id = params.id;
    const { name, image } = await req.json();

    const result = await db.collection('candidates').updateOne(
      { _id: new ObjectId(id) },
      { $set: { name, image } }
    );

    if (result.modifiedCount === 0) {
      return NextResponse.json({ message: 'ไม่พบข้อมูลหรือไม่มีการเปลี่ยนแปลง' }, { status: 404 });
    }

    return NextResponse.json({ message: 'อัปเดตเรียบร้อย' });
  } catch (err) {
    console.error('Update error:', err);
    return NextResponse.json({ message: 'เกิดข้อผิดพลาด' }, { status: 500 });
  }
}