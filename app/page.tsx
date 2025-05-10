"use client";
import { useState, useEffect, useCallback } from "react";
import { Award, RotateCcw } from "lucide-react";

interface Candidate {
  _id: string;
  type: string;
  index?: number;
  districtIdx?: number;
  candidateIdx?: number;
  name: string;
  image?: string;
}

interface MayorResult {
  name: string;
  image: string;
  votes: number[];
  total: number;
  rank: number;
}
interface CouncilDistrict {
  candidates: MayorResult[];
}
interface ElectionData {
  mayor: MayorResult[];
  council: CouncilDistrict[];
}

export default function Home() {
  const [loading, setLoading] = useState(true);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [data, setData] = useState<ElectionData | null>(null);
  const [activeTab, setActiveTab] = useState<"mayor" | "districts">("mayor");
  const [lastFetched, setLastFetched] = useState<Date | null>(null);

  const fetchData = useCallback(async () => {
    const res = await fetch("/api/results");
    const json = await res.json();
    setData(json);
    setLastFetched(new Date());
  }, []);

  useEffect(() => {
    const fetchCandidates = async () => {
      try {
        const res = await fetch("/api/candidates");
        const data = await res.json();
        setCandidates(data);
      } catch (err) {
        console.error("Error fetching candidates:", err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchCandidates();
  }, []);

  useEffect(() => {
    const fetchAndToggleLoading = async () => {
      setLoading(true);
      await fetchData();
      setLoading(false);
    };
    fetchAndToggleLoading();
    const interval = setInterval(fetchAndToggleLoading, 60 * 1000); // รีเฟรชทุก 1 นาที
    return () => clearInterval(interval);
  }, [fetchData]);

  // Merge object results with candidate metadata for display
  const mayorList = data?.mayor?.map((m, idx) => {
    const info = candidates.find(c => c.type === 'mayor' && c.index === idx);
    return {
      index: idx,
      score: m.total,
      name: info?.name ?? m.name,
      image: info?.image ?? m.image,
      rank: m.rank
    };
  }) ?? [];

  const districtsList = data?.council?.map((district, districtIdx) =>
    district.candidates.map((m, candidateIdx) => {
      const info = candidates.find(c =>
        c.type === 'council' &&
        c.districtIdx === districtIdx &&
        c.candidateIdx === candidateIdx
      );
      return {
        districtIdx,
        candidateIdx,
        score: m.total,
        rank: m.rank,
        name: info?.name ?? m.name,
        image: info?.image ?? m.image
      };
    })
  ) ?? [];

  if (!data) return <p className="text-center text-lg">กำลังโหลดข้อมูล...</p>;

  const highestMayor = Math.max(...mayorList.map(c => c.score));

  return (
    <div className="mx-auto max-w-full py-2 px-4 bg-gray-50 min-h-screen text-gray-900">
      <h1 className="text-2xl font-bold text-center text-blue-600 mb-2">ผลการนับคะแนนเลือกตั้งอย่างไม่เป็นทางการ</h1>
      <h2 className="text-xl font-medium text-center text-gray-700 mb-4">
        เทศบาลเมืองตาคลี อ.ตาคลี จ.นครสวรรค์
      </h2>
      
      

      {/* <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
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
      </div> */}

      <div className="bg-white rounded-lg shadow p-4">
        {/* Mayor Section */}
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">คะแนนนายกเทศมนตรี (รวมทุกเขต)</h2>
          {lastFetched && (
            <p className="text-sm text-gray-500 flex items-center space-x-1">
              <RotateCcw
                className={`w-4 h-4 ${
                  loading ? "animate-spin" : ""
                } transition duration-3000`}
              />
              <span>
                อัพเดทล่าสุด:{" "}
                {lastFetched.toLocaleDateString("th-TH", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}{" "}
                เวลา{" "}
                {lastFetched.toLocaleTimeString("th-TH", {
                  hour: "2-digit",
                  minute: "2-digit",
                })} น.
              </span>
            </p>
          )}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          {mayorList.map((candidate, i) => (
            <div
              key={i}
              className={`rounded-lg shadow p-4 flex items-center ${
                candidate.score === highestMayor
                  ? "ring-4 ring-yellow-300 shadow-lg bg-yellow-50"
                  : "bg-gray-50"
              }`}
            >
              {/* Image */}
              <div className="flex-shrink-0">
                {candidate.image && candidate.image.trim() !== "" ? (
                  <img
                    src={candidate.image!}
                    alt={`รูปผู้สมัคร ${candidate.name}`}
                    className="w-24 h-24 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-24 h-24 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 text-xs">
                    ไม่มีรูป
                  </div>
                )}
              </div>
              {/* Content */}
              <div className="flex-1 ml-4">
                <p className="text-right font-bold text-lg">เบอร์ {candidate.index + 1}</p>
                <p className="font-bold text-lg">{candidate.name}</p>
                <div className="mt-2 flex items-center space-x-2">
                  <div className="text-2xl font-bold text-blue-600">
                    {candidate.score?.toLocaleString() ?? 0}
                  </div>
                  <div className="flex-1 h-2 bg-blue-200 rounded">
                    <div
                      className="h-2 bg-blue-600 rounded"
                      style={{
                        width: `${
                          ((candidate.score ?? 0) /
                            mayorList.reduce((a, b) => a + (b.score ?? 0), 0)) *
                          100
                        }%`,
                      }}
                    />
                  </div>
                </div>
                <p className="text-right text-2xl font-bold text-purple-600 mt-1 flex justify-end items-center space-x-1">
                  {candidate.rank === 1 && <Award className="w-8 h-8 animate-pulse" />}
                  <span>อันดับ {candidate.rank}</span>
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Council Section */}
        <h2 className="text-lg font-semibold mb-2">ผลคะแนนสมาชิกสภาเทศบาล (สท.)</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {districtsList.map((district, districtIdx) => (
            <div
              key={districtIdx}
              className={`bg-white rounded-lg shadow border p-4 ${
                districtIdx === 0
                  ? 'border-blue-200'
                  : districtIdx === 1
                  ? 'border-green-200'
                  : 'border-yellow-200'
              }`}
            >
              <h3
                className={`text-lg font-semibold mb-2 rounded-t px-2 py-1 ${
                  districtIdx === 0
                    ? 'bg-blue-100 text-blue-800'
                    : districtIdx === 1
                    ? 'bg-green-100 text-green-800'
                    : 'bg-yellow-100 text-yellow-800'
                }`}
              >
                เขต {districtIdx + 1}
              </h3>
              <table className="w-full table-auto">
                <thead>
                  <tr className="bg-white">
                    <th className="px-2 py-1 text-center"></th>
                    <th className="px-2 py-1 text-center">เบอร์</th>
                    <th className="px-2 py-1 text-left">ชื่อ-นามสกุล</th>
                    <th className="px-2 py-1 text-right">คะแนน</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {district
                    .sort((a, b) => b.score - a.score)
                    .map((candidate, i) => (
                      <tr
                        key={i}
                        className={`transition-colors duration-150 hover:bg-gray-50 ${
                          candidate.rank <= 6 ? 'bg-green-50' : ''
                        }`}
                      >
                        <td className="px-2 py-1 text-center">
                          {candidate.image && candidate.image.trim() !== "" ? (
                            <img
                              src={candidate.image!}
                              alt={`รูป ${candidate.name}`}
                              className="w-10 h-10 rounded-full object-cover mx-auto"
                            />
                          ) : (
                            <div className="w-10 h-10 bg-gray-200 rounded-full mx-auto" />
                          )}
                        </td>
                        <td className="px-2 py-1 text-center">
                          {candidate.candidateIdx! + 1}
                        </td>
                        <td className="px-2 py-1 text-left whitespace-nowrap">
                          {candidate.name}
                        </td>
                        <td className="px-2 py-1 text-right font-semibold">
                          {candidate.score.toLocaleString()}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}