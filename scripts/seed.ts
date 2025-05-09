import dotenv from 'dotenv';
dotenv.config();

import { MongoClient } from "mongodb";

const uri = process.env.MONGODB_URI!;
const client = new MongoClient(uri);

async function seed() {
  try {
    await client.connect();
    const db = client.db("election");
    const collection = db.collection("candidates");

    await collection.deleteMany({});

    const mayor = Array(3).fill(0).map((_, index) => ({
      type: "mayor",
      index,
      name: `ผู้สมัครนายก ${index + 1}`,
      image: "",
    }));

    const council = [];
    for (let districtIdx = 0; districtIdx < 3; districtIdx++) {
      for (let candidateIdx = 0; candidateIdx < 7; candidateIdx++) {
        council.push({
          type: "council",
          districtIdx,
          candidateIdx,
          name: `ผู้สมัคร สท เขต${districtIdx + 1}-${candidateIdx + 1}`,
          image: "",
        });
      }
    }

    await collection.insertMany([...mayor, ...council]);

    console.log("✅ Seed data completed.");
  } catch (err) {
    console.error("❌ Seed error:", err);
  } finally {
    await client.close();
  }
}

seed();