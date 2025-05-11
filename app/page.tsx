"use client";
import { useState, useEffect, useCallback } from "react";
import { Award, RotateCcw, BadgeCheck, Info, Box } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast, Toaster } from "sonner";

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
  const [newData, setNewData] = useState(false);
  const [highlightLeader, setHighlightLeader] = useState(true);


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
    // initial fetch
    fetchAndToggleLoading();

    // listen for admin updates via BroadcastChannel
    const bc = new BroadcastChannel("election");
    bc.onmessage = (e) => {
      if (e.data === "updated") {
        fetchAndToggleLoading();
        toast.success("มีผลคะแนนอัพเดทใหม่!");
      }
    };
    // Add interval for fetching every 1 minute
    const interval = setInterval(() => {
      fetchAndToggleLoading();
    }, 3000); // 1 minute
    return () => {
      bc.close();
      clearInterval(interval);
    };
  }, [fetchData]);


  // Merge object results with candidate metadata for display
  const mayorList = data?.mayor?.map((m, idx) => {
    const info = candidates.find(c => c.type === 'mayor' && c.index === idx);
    return {
      index: idx,
      score: m.total,
      name: info?.name ?? m.name,
      image: info?.image ?? m.image,
      rank: m.rank,
      votes: m.votes
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

  const highestMayor = mayorList.length > 0 ? Math.max(...mayorList.map(c => c.score)) : 0;

  useEffect(() => {
    setHighlightLeader(true);
    const timer = setTimeout(() => setHighlightLeader(false), 3000);
    return () => clearTimeout(timer);
  }, [highestMayor]);

  // Compute if all 3 council districts are 100% reported
  const allDistrictsReported100 = data?.council?.every(district => {
    const totalUnits = district?.candidates[0]?.votes.length ?? 0;
    const reportedUnits = Array.from({ length: totalUnits }, (_, idx) => {
      return district?.candidates.some(c => c.votes[idx] > 0);
    }).filter(Boolean);
    return reportedUnits.length === totalUnits && totalUnits > 0;
  });

  if (!data) return <p className="text-center text-lg">กำลังโหลดข้อมูล...</p>;

  return (
    <div className="mx-auto max-w-full py-2 px-4 bg-white min-h-screen text-gray-900">
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: '#dcfce7',
            color: '#166534',
            fontSize: '1.25rem',
            padding: '1rem 1.5rem'
          },
          duration: 5000,
          className: "transition-all duration-1000 ease-in-out"
        }}
      />
      <h1 className="text-4xl font-noto-thai font-extrabold text-center text-blue-600 mb-2">ผลการนับคะแนนเลือกตั้งสมาชิกสภาเทศบาลเมืองตาคลี และนายกเทศมนตรีเมืองตาคลี <span className="text-red-600">(อย่างไม่เป็นทางการ)</span></h1>
      <h2 className="text-2xl font-noto-thai font-bold text-center text-gray-700 mb-4">
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
          <h2 className="text-3xl font-noto-thai font-extrabold">คะแนนนายกเทศมนตรี (รวมทุกเขต)</h2>
          {lastFetched && (
            <p className="text-lg text-gray-500 flex items-center space-x-1">
              <RotateCcw
                className={`w-4 h-4 ${
                  loading ? "animate-spin" : ""
                } transition duration-[5000ms]`}
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
            <motion.div
              key={i}
              className={`relative overflow-hidden rounded-lg shadow-lg p-6 flex items-center transition-all ${
                candidate.score === 0
                  ? "bg-gray-50 border border-gray-300 scale-100 opacity-100"
                  : candidate.score === highestMayor
                    ? allDistrictsReported100
                      ? "ring-8 neon-glow-rainbow scale-[1.05]"
                      : "ring-8 neon-glow-yellow scale-[1.05]"
                    : "bg-gray-50 border border-gray-300 scale-90 opacity-90"
              }`}
              initial={{ opacity: 0, y: 20 }}
              animate={{
                opacity: 1,
                y: 0
              }}
              transition={{ duration: 0.6, delay: i * 0.1 }}
              whileHover={{ scale: 1.05 }}
            >
              {/* Image */}
              <div className="flex-shrink-0">
                {candidate.image && candidate.image.trim() !== "" ? (
                  <img
                    src={candidate.image!}
                    alt={`รูปผู้สมัคร ${candidate.name}`}
                    className="w-56 h-56 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-56 h-56 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 text-xs">
                    ไม่มีรูป
                  </div>
                )}
                {candidate.score === highestMayor && allDistrictsReported100 && (
                  <p className="text-center text-lg font-semibold text-green-700 mt-2">ผู้ชนะการเลือกตั้ง</p>
                )}
              </div>
              {/* Content */}
              <div className="flex-1 ml-6">
                <p className="text-right font-bold text-2xl">เบอร์ {candidate.index + 1}</p>
                {candidate.score === highestMayor && highlightLeader ? (
                  <motion.p
                    className="candidate-name font-bold text-2xl"
                    animate={{ opacity: [0.5, 1], scale: [1, 1.05] }}
                    transition={{ repeat: Infinity, repeatType: 'reverse', duration: 0.8, ease: 'easeInOut' }}
                  >
                    {candidate.name}
                  </motion.p>
                ) : (
                  <p className="candidate-name font-bold text-2xl">
                    {candidate.name}
                  </p>
                )}
                <div className="mt-2 relative">
                  <div className="absolute -top-2 right-0 text-lg font-bold text-gray-600">
                    {(
                      ((candidate.score ?? 0) /
                        mayorList.reduce((sum, c) => sum + (c.score ?? 0), 0)) *
                      100
                    ).toFixed(2)}%
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="text-5xl font-bold text-blue-600">
                      {candidate.score?.toLocaleString() ?? 0}
                    </div>
                    <div className="flex-1">
                      <div className="h-2 bg-blue-200 rounded">
                        <div
                          className="h-2 bg-blue-600 rounded"
                          style={{
                            width: `${
                              ((candidate.score ?? 0) /
                                mayorList.reduce((sum, c) => sum + (c.score ?? 0), 0)) *
                              100
                            }%`,
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 justify-end text-xl font-medium mt-1">
                  <div className="px-1 rounded bg-blue-200 text-blue-900">
                    เขต 1: {candidate.votes.slice(0, 8).reduce((sum, v) => sum + v, 0).toLocaleString()}
                  </div>
                  <div className="px-1 rounded bg-green-200 text-green-900">
                    เขต 2: {candidate.votes.slice(8, 17).reduce((sum, v) => sum + v, 0).toLocaleString()}
                  </div>
                  <div className="px-1 rounded bg-pink-200 text-pink-900">
                    เขต 3: {candidate.votes.slice(17).reduce((sum, v) => sum + v, 0).toLocaleString()}
                  </div>
                  <span className="text-black"> คะแนน</span>
                </div>
                {candidate.score !== 0 && (
                  <p className="text-right text-2xl font-bold mt-1 flex justify-end items-center space-x-1">
                    {candidate.rank === 1 && <Award className="w-8 h-8 rainbow-text animate-pulse" />}
                    <span className={candidate.rank === 1 ? 'rainbow-text' : 'text-purple-600'}>
                      คะแนนอันดับ {candidate.rank}
                    </span>
                  </p>
                )}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Council Section */}
        <h2 className="text-3xl font-noto-thai font-extrabold mb-2">คะแนนสมาชิกสภาเทศบาล (สท.)</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {districtsList.map((district, districtIdx) => (
            <motion.div
              key={districtIdx}
              className={`bg-white rounded-lg shadow border p-4 ${
                districtIdx === 0
                  ? 'border-blue-200'
                  : districtIdx === 1
                  ? 'border-green-200'
                  : 'border-pink-200'
              }`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: districtIdx * 0.3, ease: "easeInOut" }}
              whileHover={{ scale: 1.03 }}
            >
              <h3
                className={`text-3xl font-semibold mb-0 rounded-t px-2 py-1 ${
                  districtIdx === 0
                    ? 'bg-blue-300 text-blue-900'
                    : districtIdx === 1
                    ? 'bg-green-300 text-green-900'
                    : 'bg-pink-300 text-pink-900'
                }`}
              >
                เขต {districtIdx + 1}
              </h3>
              <table className="w-full table-auto">
                <thead>
                  <tr className={`${
                    districtIdx === 0
                      ? 'bg-blue-300 text-blue-900'
                      : districtIdx === 1
                      ? 'bg-green-300 text-green-900'
                      : 'bg-pink-300 text-pink-900'
                  }`}>
                    <th className="px-2 py-1 text-center"></th>
                    <th className="px-2 py-1 text-center">เบอร์</th>
                    <th className="px-2 py-1 align-middle text-left">ชื่อ-นามสกุล</th>
                    <th className="px-2 py-1 text-right">คะแนน</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  <AnimatePresence initial={false}>
                    {district
                      .sort((a, b) => b.score - a.score)
                      .map((candidate, i) => (
                        <motion.tr
                          key={candidate.candidateIdx}
                          layout
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 10 }}
                          transition={{ duration: 0.6, delay: i * 0.1, ease: "easeInOut" }}
                          className={`transition-colors duration-150 hover:bg-gray-50 ${
                            candidate.score === 0
                              ? ''
                              : candidate.rank <= 6
                                ? districtIdx === 0
                                  ? 'bg-blue-100 font-semibold'
                                  : districtIdx === 1
                                    ? 'bg-green-100 font-semibold'
                                    : 'bg-pink-100 font-semibold'
                                : ''
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
                          <td className="px-2 py-1 text-center font-bold">
                            {candidate.candidateIdx! + 1}
                          </td>
                          <td className="px-2 py-2 flex items-center justify-between h-12">
                            <span>{candidate.name}</span>
                            {candidate.rank <= 6 && allDistrictsReported100 ? (
                              <motion.div
                                initial={{ opacity: 0.3 }}
                                animate={{ opacity: [0.3, 1, 0.3, 1] }}
                                transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
                              >
                                <BadgeCheck className="ml-2 w-5 h-5 text-green-500 animate-pulse" />
                              </motion.div>
                            ) : null}
                          </td>
                          <td
                            className={`px-2 py-1 text-right font-semibold text-xl ${
                              candidate.rank <= 6 ? 'text-blue-600' : 'text-black'
                            }`}
                          >
                            {candidate.score.toLocaleString()}
                          </td>
                        </motion.tr>
                      ))}
                  </AnimatePresence>
                </tbody>
              </table>
              {/* เพิ่ม div แสดงหน่วยที่ส่งคะแนนแล้ว ต่อท้ายตารางเขต */}
              <div className="relative mt-4 p-4 bg-yellow-50 border border-yellow-300 rounded text-yellow-800">
                <h4 className="font-bold mb-1">หน่วยที่ส่งคะแนนแล้ว (เขต {districtIdx + 1}):</h4>
                <div className="flex flex-wrap gap-2">
                  {(() => {
                    const totalUnits = data?.council?.[districtIdx]?.candidates[0]?.votes.length ?? 0;
                    const reportedUnits = Array.from({ length: totalUnits }, (_, idx) => {
                      const councilVote = data?.council?.[districtIdx]?.candidates.some(c => c.votes[idx] > 0);
                      return councilVote ? idx + 1 : null;
                    }).filter(Boolean);
                    return reportedUnits.length > 0 ? (
                      reportedUnits.map((unit, idx) => (
                        <span
                          key={idx}
                          className="inline-flex items-center gap-2 bg-yellow-100 text-yellow-900 border border-yellow-300 rounded-full px-2 py-1 text-base font-semibold shadow basis-1/9"
                          style={{ flexBasis: "calc(100% / 9 - 0.75rem)" }}
                        >
                          <Box className="w-8 h-8" />
                          {unit}
                        </span>
                      ))
                    ) : (
                      <span className="italic text-sm">ยังไม่มีหน่วยส่งคะแนน</span>
                    );
                  })()}
                </div>
                <div
                  className={`absolute top-0 right-0 -translate-y-5 rounded-lg px-5 py-3 text-4xl font-extrabold shadow-lg ${
                    (() => {
                      const totalUnits = data?.council?.[districtIdx]?.candidates[0]?.votes.length ?? 0;
                      const reportedUnits = Array.from({ length: totalUnits }, (_, idx) => {
                        const councilVote = data?.council?.[districtIdx]?.candidates.some(c => c.votes[idx] > 0);
                        return councilVote ? idx + 1 : null;
                      }).filter(Boolean);
                      const percent = Math.floor((reportedUnits.length / (totalUnits || 1)) * 100);
                      return percent === 100
                        ? 'bg-green-200 text-green-900 animate-blink'
                        : 'bg-yellow-200 text-yellow-900';
                    })()
                  }`}
                >
                  {(() => {
                    const totalUnits = data?.council?.[districtIdx]?.candidates[0]?.votes.length ?? 0;
                    const reportedUnits = Array.from({ length: totalUnits }, (_, idx) => {
                      const councilVote = data?.council?.[districtIdx]?.candidates.some(c => c.votes[idx] > 0);
                      return councilVote ? idx + 1 : null;
                    }).filter(Boolean);
                    return Math.floor((reportedUnits.length / (totalUnits || 1)) * 100);
                  })()}%
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    <style jsx global>{`
      @keyframes neonBorder {
        0%, 100% { box-shadow: 0 0 5px #facc15, 0 0 10px #facc15; }
        50%     { box-shadow: 0 0 20px #facc15, 0 0 30px #facc15; }
      }
      .neon {
        animation: neonBorder 2s ease-in-out infinite;
      }
      @keyframes rainbow {
        0% { color: #ff0000; }
        15% { color: #ffa500; }
        30% { color: #ffff00; }
        45% { color: #008000; }
        60% { color: #0000ff; }
        75% { color: #4b0082; }
        90% { color: #ee82ee; }
        100% { color: #ff0000; }
      }
      .rainbow-text {
        animation: rainbow 2s linear infinite;
      }
      @keyframes rainbowBorder {
        0% { box-shadow: 0 0 5px red; }
        15% { box-shadow: 0 0 5px orange; }
        30% { box-shadow: 0 0 5px yellow; }
        45% { box-shadow: 0 0 5px green; }
        60% { box-shadow: 0 0 5px blue; }
        75% { box-shadow: 0 0 5px indigo; }
        90% { box-shadow: 0 0 5px violet; }
        100% { box-shadow: 0 0 5px red; }
      }
      .rainbow-border {
        border: 4px solid transparent;
        animation: rainbowBorder 2s infinite;
      }
      @keyframes blink {
        0%, 50%, 100% { opacity: 1; }
        25%, 75% { opacity: 0.3; }
      }
      .animate-blink {
        animation: blink 2s infinite;
      }
      /* Neon glow rainbow and yellow for mayor card */
      @keyframes neonGlowRainbow {
        0% { box-shadow: 0 0 20px red; }
        20% { box-shadow: 0 0 20px orange; }
        40% { box-shadow: 0 0 20px yellow; }
        60% { box-shadow: 0 0 20px green; }
        80% { box-shadow: 0 0 20px blue; }
        100% { box-shadow: 0 0 20px violet; }
      }
      @keyframes neonGlowYellow {
        0%, 100% { box-shadow: 0 0 20px #facc15, 0 0 40px #facc15; }
        50% { box-shadow: 0 0 40px #facc15, 0 0 60px #facc15; }
      }
      .neon-glow-rainbow {
        animation: neonGlowRainbow 6s infinite alternate;
        background-color: #fff;
      }
      .neon-glow-yellow {
        animation: neonGlowYellow 6s infinite alternate;
        background-color: #fff;
      }
    `}</style>
    <footer className="mt-8 text-center text-sm text-gray-500">
      <span>✨ Smart-Takhli@NextCity ✨</span>
    </footer>
    </div>
  );
}