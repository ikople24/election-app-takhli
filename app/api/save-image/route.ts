import { MongoClient } from "mongodb";

export async function POST(req: Request) {
  const client = new MongoClient(process.env.MONGO_URI!);
  
  try {
    await client.connect(); // ensure connection
    const { type, index, districtIdx, candidateIdx, url } = await req.json();
    const db = client.db("election");
    const collection = db.collection("candidates");

    let filter: any = { type };
    if (type === "mayor" && index !== undefined) {
      filter.index = Number(index);
    } else if (type === "council" && districtIdx !== undefined && candidateIdx !== undefined) {
      filter.districtIdx = Number(districtIdx);
      filter.candidateIdx = Number(candidateIdx);
    } else {
      return new Response(JSON.stringify({ success: false, message: "Invalid parameters" }), { status: 400 });
    }

    console.log("Filter query:", filter);

    const result = await collection.updateOne(
      filter,
      { $set: { image: url } },
      { upsert: false }
    );

    console.log("Update result:", result);

    if (result.matchedCount === 0) {
      return new Response(JSON.stringify({ success: false, message: "No matching document found" }), { status: 404 });
    }
    return new Response(JSON.stringify({ success: true, modifiedCount: result.modifiedCount }));
  } catch (error) {
    console.error("Error in save-image API:", error);
    return new Response(JSON.stringify({ success: false, message: "Internal server error" }), { status: 500 });
  } finally {
    await client.close();
  }
}