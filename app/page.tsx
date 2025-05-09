"use client";
import { useState, useEffect } from "react";

interface Candidate {
  name: string;
  score: number;
}

interface ElectionData {
  mayor: Candidate[];
  districts: Candidate[][];
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

  if (!data) return <p className="text-center text-lg">กำลังโหลดข้อมูล...</p>;

  const highestMayor = Math.max(...data.mayor.map(c => c.score));

  return (
    <div className="max-w-6xl mx-auto p-6 bg-gray-50 min-h-screen text-gray-900">
      <h1 className="text-4xl font-bold text-center text-blue-600 mb-6">ผลการนับคะแนนเลือกตั้ง</h1>
      <p className="text-center text-gray-500 mb-8">อัพเดทล่าสุด: 15 มิถุนายน 2566 เวลา 18:30 น.</p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-white rounded-lg shadow p-4 text-center">
          <p className="text-sm text-gray-500">จำนวนผู้มีสิทธิเลือกตั้ง</p>
          <p className="text-3xl font-bold text-blue-600">125,487</p>
          <div className="h-2 bg-blue-200 rounded mt-2"><div className="w-full h-2 bg-blue-600 rounded"></div></div>
        </div>
        <div className="bg-white rounded-lg shadow p-4 text-center">
          <p className="text-sm text-gray-500">จำนวนผู้มาใช้สิทธิ</p>
          <p className="text-3xl font-bold text-green-600">98,245</p>
          <div className="h-2 bg-green-200 rounded mt-2"><div className="w-[78%] h-2 bg-green-600 rounded"></div></div>
          <p className="text-sm text-gray-500">คิดเป็น 78.29% ของผู้มีสิทธิ</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4 text-center">
          <p className="text-sm text-gray-500">บัตรเสีย</p>
          <p className="text-3xl font-bold text-red-600">1,245</p>
          <div className="h-2 bg-red-200 rounded mt-2"><div className="w-[1.27%] h-2 bg-red-600 rounded"></div></div>
          <p className="text-sm text-gray-500">คิดเป็น 1.27% ของผู้มาใช้สิทธิ</p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex border-b mb-4">
          <button className="px-4 py-2 border-b-2 border-blue-600 text-blue-600 font-semibold">คะแนนนายกเทศมนตรี</button>
          <button className="px-4 py-2 text-gray-500">คะแนนสมาชิกสภาเทศบาล (สท.)</button>
        </div>

        <h2 className="text-lg font-semibold mb-4">คะแนนนายกเทศมนตรี (รวมทุกเขต)</h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {data.mayor.map((candidate, i) => (
            <div
              key={i}
              className={`rounded-lg shadow p-4 text-center ${
                candidate.score === highestMayor
                  ? "border-2 border-yellow-400 bg-yellow-50"
                  : "bg-gray-50"
              }`}
            >
              <p className="text-sm font-semibold mb-2">เบอร์ {i + 1}</p>
              <p className="font-bold text-lg">{candidate.name}</p>
              <p className="text-sm text-gray-500">พรรคพัฒนาบ้านเมือง</p>
              <p className="mt-2 text-2xl font-bold text-blue-600">
                {candidate.score?.toLocaleString() ?? 0}
              </p>
              <div className="h-2 bg-blue-200 rounded mt-2">
                <div
                  className="h-2 bg-blue-600 rounded"
                  style={{
                    width: `${
                      ((candidate.score ?? 0) /
                        data.mayor.reduce((a, b) => a + (b.score ?? 0), 0)) *
                      100
                    }%`,
                  }}
                ></div>
              </div>
              <p className="text-sm text-gray-500 mt-1">อันดับ {i + 1}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}