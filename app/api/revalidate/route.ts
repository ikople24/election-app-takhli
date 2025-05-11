// revalidate API handler
import { NextRequest } from "next/server";
import { revalidatePath } from "next/cache";

export async function POST(req: NextRequest) {
  const { path } = await req.json(); // path เช่น "/"
  revalidatePath(path);
  return Response.json({ revalidated: true });
}