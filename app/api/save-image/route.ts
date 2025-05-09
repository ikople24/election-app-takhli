

import { promises as fs } from 'fs';
import path from 'path';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  const body = await req.json();
  const filePath = path.join(process.cwd(), 'app/data/results.json');

  try {
    const jsonData = JSON.parse(await fs.readFile(filePath, 'utf-8'));

    if (body.type === 'mayor') {
      jsonData.mayor[body.index].image = body.url;
    } else if (body.type === 'council') {
      jsonData.council[body.districtIdx].candidates[body.candidateIdx].image = body.url;
    } else {
      return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
    }

    await fs.writeFile(filePath, JSON.stringify(jsonData, null, 2));
    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ error: 'Unknown error' }, { status: 500 });
  }
}