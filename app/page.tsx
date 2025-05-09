"use client";
import { useState, useEffect } from "react";

interface ElectionData {
  mayor: number[];
  districts: number[][];
}

export default function Home() {
  const [data, setData] = useState<ElectionData | null>(null);

  const fetchData = async () => {
    const res = await fetch("/api/results");
    const json = await res.json();
    setData(json);
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 10 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  if (!data) return <p>Loading...</p>;

  return (
    <div className="max-w-4xl mx-auto p-4">
      <h1 className="text-3xl font-bold text-center mb-6">สรุปผลเลือกตั้ง</h1>

      <div className="mb-8">
        <h2 className="text-xl font-semibold">นายก</h2>
        <ul>
          {(data?.mayor ?? []).map((score, i) => (
            <li key={i}>เบอร์ {i + 1}: {score} คะแนน</li>
          ))}
        </ul>
      </div>

      {(data?.districts ?? []).map((district, idx) => (
        <div key={idx} className="mb-6">
          <h2 className="text-xl font-semibold">เขต {idx + 1}</h2>
          <ul>
            {(district ?? []).map((score, i) => (
              <li key={i}>เบอร์ {i + 1}: {score} คะแนน</li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}