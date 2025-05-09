import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const filePath = path.join(process.cwd(), 'app', 'data', 'results.json');

export async function GET() {
  try {
    const data = fs.readFileSync(filePath, 'utf8');
    return NextResponse.json(JSON.parse(data));
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Failed to read file' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    fs.writeFileSync(filePath, JSON.stringify(body, null, 2));
    return NextResponse.json({ message: 'Updated successfully' });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Failed to write file' }, { status: 500 });
  }
}