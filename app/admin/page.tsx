
// @ts-nocheck
"use client";

import { useState, useEffect } from "react";
import { Edit3, UserRoundPen, Lock, Unlock } from "lucide-react";
import Swal from 'sweetalert2';


interface Candidate {
  name: string;
  votes: number[];
  total: number;
  rank: number;
}

interface CouncilDistrict {
  candidates: Candidate[];
}

interface AdminData {
  mayor: Candidate[]; // เปลี่ยนจาก number[] เป็น Candidate[]
  council: CouncilDistrict[]; // 3 district
}

export default function Admin() {
  // broadcast channel to notify root page when data is saved
  const channel = new BroadcastChannel("election");
  const [focusedTable, setFocusedTable] = useState<"mayor" | number | null>(null);
  const [data, setData] = useState<AdminData | null>(null);
  // เพิ่ม state สำหรับตารางที่ถูกแก้ไข
  const [modifiedTables, setModifiedTables] = useState<Set<"mayor" | number>>(new Set());
  // เพิ่ม state สำหรับหน่วยที่ถูกแก้ไข (แยกตามแต่ละตาราง)
  const [modifiedUnits, setModifiedUnits] = useState<Map<"mayor" | number, Set<number>>>(new Map());
  // เพิ่ม state สำหรับตารางที่ถูกปิดนับคะแนน
  const [lockedTables, setLockedTables] = useState<Set<"mayor" | number>>(new Set());
  // เพิ่ม state สำหรับ timestamp เมื่อปิดนับคะแนน
  const [lockedTimestamps, setLockedTimestamps] = useState<Map<"mayor" | number, string>>(new Map());

  useEffect(() => {
    const saved = localStorage.getItem("electionData");
    if (saved) {
      setData(JSON.parse(saved));
    } else {
      setData({
        mayor: Array(3).fill(0).map((_, i) => ({
          name: `ผู้สมัครนายก ${i + 1}`,
          votes: Array(24).fill(0),
          total: 0,
          rank: 0,
        })),
        council: [
          {
            candidates: Array(7).fill(0).map((_, i) => ({
              name: `ผู้สมัคร สท ${i + 1}`,
              votes: Array(8).fill(0),
              total: 0,
              rank: 0,
            })),
          },
          {
            candidates: Array(7).fill(0).map((_, i) => ({
              name: `ผู้สมัคร สท ${i + 1}`,
              votes: Array(9).fill(0),
              total: 0,
              rank: 0,
            })),
          },
          {
            candidates: Array(7).fill(0).map((_, i) => ({
              name: `ผู้สมัคร สท ${i + 1}`,
              votes: Array(7).fill(0),
              total: 0,
              rank: 0,
            })),
          },
        ],
      });
    }
    // Load lockedTables and lockedTimestamps from localStorage
    if (typeof window !== "undefined") {
      const lockedTablesSaved = localStorage.getItem("lockedTables");
      if (lockedTablesSaved) {
        setLockedTables(new Set(JSON.parse(lockedTablesSaved)));
      }

      const lockedTimestampsSaved = localStorage.getItem("lockedTimestamps");
      if (lockedTimestampsSaved) {
        setLockedTimestamps(new Map(JSON.parse(lockedTimestampsSaved)));
      }
    }
  }, []);

  const [editingCandidate, setEditingCandidate] = useState<{ type: "mayor" | "council"; districtIdx?: number; candidateIdx: number } | null>(null);
  const [newCandidateName, setNewCandidateName] = useState("");

  // ฟังก์ชันรีเซตข้อมูลกลับค่า default (update: overwrite localStorage & notify root)
  const resetData = () => {
    const defaultData = {
      mayor: Array(3).fill(0).map((_, i) => ({
        name: `ผู้สมัครนายก ${i + 1}`,
        votes: Array(24).fill(0),
        total: 0,
        rank: 0,
      })),
      council: [
        {
          candidates: Array(7).fill(0).map((_, i) => ({
            name: `ผู้สมัคร สท ${i + 1}`,
            votes: Array(8).fill(0),
            total: 0,
            rank: 0,
          })),
        },
        {
          candidates: Array(7).fill(0).map((_, i) => ({
            name: `ผู้สมัคร สท ${i + 1}`,
            votes: Array(9).fill(0),
            total: 0,
            rank: 0,
          })),
        },
        {
          candidates: Array(7).fill(0).map((_, i) => ({
            name: `ผู้สมัคร สท ${i + 1}`,
            votes: Array(7).fill(0),
            total: 0,
            rank: 0,
          })),
        },
      ],
    };
    localStorage.removeItem("electionData"); // ลบข้อมูลเก่า
    localStorage.removeItem("electionUpdatedAt"); // ลบ timestamp เก่า
    localStorage.setItem("electionData", JSON.stringify(defaultData)); // เขียนค่าใหม่
    localStorage.setItem("electionUpdatedAt", Date.now().toString()); // timestamp ใหม่
    setData(defaultData); // อัพเดต state
    const channel = new BroadcastChannel("election");
    channel.postMessage("reset");
    Swal.fire({
      icon: 'success',
      title: 'รีเซตข้อมูลเรียบร้อย',
      showConfirmButton: false,
      timer: 1500
    });
  };

  const handleMayorVoteChange = (candidateIdx: number, unitIdx: number, val: string) => {
    const updated = [...data!.mayor];
    updated[candidateIdx] = { ...updated[candidateIdx] };
    updated[candidateIdx].votes = [...updated[candidateIdx].votes];
    updated[candidateIdx].votes[unitIdx] = Number(val);
    updated[candidateIdx].total = updated[candidateIdx].votes.reduce((a, b) => a + b, 0);
    setData({ ...data!, mayor: updated });
    setModifiedTables((prev) => new Set(prev).add("mayor"));
    setModifiedUnits((prev) => {
      const newMap = new Map(prev);
      const currentSet = newMap.get("mayor") ?? new Set();
      currentSet.add(unitIdx);
      newMap.set("mayor", currentSet);
      return newMap;
    });
  };

  const handleCouncilVoteChange = (districtIdx: number, candidateIdx: number, unitIdx: number, val: string) => {
    const updated = [...data!.council];
    updated[districtIdx].candidates[candidateIdx].votes[unitIdx] = Number(val);
    updated[districtIdx].candidates[candidateIdx].total = updated[districtIdx].candidates[candidateIdx].votes.reduce((a, b) => a + b, 0);
    setData({ ...data!, council: updated });
    setModifiedTables((prev) => new Set(prev).add(districtIdx));
    setModifiedUnits((prev) => {
      const newMap = new Map(prev);
      const currentSet = newMap.get(districtIdx) ?? new Set();
      currentSet.add(unitIdx);
      newMap.set(districtIdx, currentSet);
      return newMap;
    });
  };

  const handleSaveMayor = async () => {
    const ranked = data!.mayor
      .map((c, _, arr) => ({
        ...c,
        rank: arr.filter(other => other.total > c.total).length + 1
      }));

    const updatedData = { ...data!, mayor: ranked };

    await fetch("/api/results", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updatedData),
    });

    setData(updatedData);
    setModifiedTables(prev => {
      const newSet = new Set(prev);
      newSet.delete("mayor");
      return newSet;
    });
    setModifiedUnits(prev => {
      const newMap = new Map(prev);
      newMap.delete("mayor");
      return newMap;
    });
    Swal.fire({
      icon: 'success',
      title: 'บันทึกผล นายก เรียบร้อย',
      showConfirmButton: false,
      timer: 1500
    });
    localStorage.setItem("electionUpdatedAt", Date.now().toString());
    channel.postMessage("updated");
  };

  const handleSaveCouncil = async (districtIdx: number) => {
    const updatedCouncil = [...data!.council];
    const ranked = updatedCouncil[districtIdx].candidates
      .map((c, _, arr) => ({
        ...c,
        rank: arr.filter(other => other.total > c.total).length + 1
      }));

    updatedCouncil[districtIdx].candidates = ranked;

    const updatedData = { ...data!, council: updatedCouncil };

    await fetch("/api/results", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updatedData),
    });

    setData(updatedData);
    setModifiedTables(prev => {
      const newSet = new Set(prev);
      newSet.delete(districtIdx);
      return newSet;
    });
    setModifiedUnits(prev => {
      const newMap = new Map(prev);
      newMap.delete(districtIdx);
      return newMap;
    });
    Swal.fire({
      icon: 'success',
      title: `บันทึกผล เขต ${districtIdx + 1} เรียบร้อย`,
      showConfirmButton: false,
      timer: 1500
    });
    localStorage.setItem("electionUpdatedAt", Date.now().toString());
    channel.postMessage("updated");
  };

  // Save data to localStorage on every change
  useEffect(() => {
    if (typeof window !== "undefined" && data) {
      localStorage.setItem("electionData", JSON.stringify(data));
    }
  }, [data]);

  // Save lockedTables and lockedTimestamps to localStorage on every change
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("lockedTables", JSON.stringify(Array.from(lockedTables)));
      localStorage.setItem("lockedTimestamps", JSON.stringify(Array.from(lockedTimestamps.entries())));
    }
  }, [lockedTables, lockedTimestamps]);

  if (!data) {
    return <p>Loading...</p>;
  }
  return (
    <div className="w-screen min-h-screen p-4 bg-white text-black overflow-x-hidden">
      {/* NavBar ปุ่มรีเซต */}
      <nav className="w-full bg-gray-100 px-4 py-2 flex justify-end items-center shadow">
        <button
          onClick={resetData}
          className="bg-red-500 text-white px-4 py-1 rounded hover:bg-red-600 shadow"
        >
          รีเซตข้อมูล
        </button>
        <button
          onClick={() => window.location.href = "/admin/uploads"}
          className="ml-2 bg-blue-500 text-white px-4 py-1 rounded hover:bg-blue-600 shadow"
        >
          อัปโหลดรูปภาพ
        </button>
      </nav>
      <h1 className="text-3xl font-bold text-center mb-8">Admin: กรอกคะแนน</h1>

      {/* ======= นายก ======= */}
      <div className={`mb-12 border-4 rounded-lg ${
        focusedTable === "mayor"
          ? "border-purple-500"
          : modifiedTables.has("mayor")
          ? "border-orange-400"
          : "border-transparent"
      }`}>
      <h2 className="text-2xl font-semibold mb-4 flex items-center justify-between">
        <span className="flex items-center">
          {focusedTable === "mayor" && <span className="animate-pulse text-purple-500 mr-2">#</span>}
          คะแนน นายก
          <UserRoundPen
            size={20}
            className="ml-2 text-blue-600 cursor-pointer"
            onClick={() => {
              setEditingCandidate({ type: "mayor", candidateIdx: 0 });
              setNewCandidateName(data!.mayor[0].name);
            }}
          />
          {lockedTables.has("mayor") ? (
            <Lock size={20} className="ml-2 text-red-500" />
          ) : (
            <Unlock size={20} className="ml-2 text-green-500" />
          )}
        </span>
        <span className="text-sm text-gray-600">
          {lockedTimestamps.get("mayor") && `ปิดนับเวลา: ${lockedTimestamps.get("mayor")}`}
        </span>
      </h2>
        <table className="w-full table-fixed bg-white text-black border border-gray-300 divide-y divide-gray-200 shadow-md rounded-lg text-sm leading-normal">
          <thead className="bg-gray-100">
              <tr>
                <th rowSpan={2} className="border border-gray-300 px-3 py-2 whitespace-normal text-center">
                  หมาย<br />เลข
                </th>
                <th rowSpan={2} className="border border-gray-300 px-3 py-2 min-w-60 whitespace-normal text-center">ชื่อ-นามสกุล</th>
                <th colSpan={8} className="border border-gray-300 px-3 py-2 bg-yellow-200 text-black whitespace-nowrap text-center">เขตเลือกตั้งที่ 1</th>
                <th colSpan={9} className="border border-gray-300 px-3 py-2 bg-pink-200 text-black whitespace-nowrap text-center">เขตเลือกตั้งที่ 2</th>
                <th colSpan={7} className="border border-gray-300 px-3 py-2 bg-blue-200 text-black whitespace-nowrap text-center">เขตเลือกตั้งที่ 3</th>
                <th rowSpan={2} className="border border-gray-300 px-3 py-2 whitespace-normal text-center align-middle">
                  คะแนน<br />รวม
                </th>
                <th rowSpan={2} className="border border-gray-300 px-3 py-2 whitespace-nowrap text-center">ลำดับ</th>
              </tr>
              <tr>
                {[...Array(24)].map((_, unitIdx) => (
                  <th
                    key={unitIdx}
                    className={`border border-gray-300 px-3 py-2 whitespace-nowrap text-center ${
                      (modifiedUnits.get("mayor")?.has(unitIdx)) ? "bg-orange-300 animate-pulse" : ""
                    } group-hover:bg-purple-100`}
                  >
                    หน่วย {unitIdx + 1}
                  </th>
                ))}
              </tr>
          </thead>
          <tbody>
            {data!.mayor.map((candidate, candidateIdx) => (
              <tr key={candidateIdx} className="group hover:bg-gray-50">
                <td className="border border-gray-300 px-3 py-2 text-center">{candidateIdx + 1}</td>
                <td className="border border-gray-300 px-3 py-2 min-w-48 text-center">
                  {candidate.name}
                </td>
                {candidate.votes.map((score, unitIdx) => (
                  <td key={unitIdx} className="border border-gray-300 px-1 py-1 group-hover:bg-purple-100">
                    <div className="flex items-center justify-center h-full">
                      <input
                        type="number"
                        min="0"
                        pattern="[0-9]*"
                        value={score === 0 ? "" : score}
                        placeholder="0"
                        disabled={lockedTables.has("mayor")}
                        onClick={(e) => {
                          if (lockedTables.has("mayor")) {
                            e.preventDefault();
                            alert("ตารางนายกถูกปิดนับคะแนนแล้ว");
                          }
                        }}
                        onKeyDown={(e) => {
                          if (e.key === '-' || e.key === '+' || e.key === 'e') {
                            e.preventDefault();
                          }
                        }}
                        onFocus={() => setFocusedTable("mayor")}
                        onBlur={() => setFocusedTable(null)}
                        onChange={(e) =>
                          handleMayorVoteChange(candidateIdx, unitIdx, e.target.value)
                        }
                        className="border border-gray-300 rounded px-2 py-2 w-full max-w-[4rem] text-center text-base focus:outline-none focus:ring-2 focus:ring-blue-400"
                      />
                    </div>
                  </td>
                ))}
                <td className="border border-gray-300 px-3 py-4 text-center text-lg font-semibold">{candidate.total}</td>
                <td className="border border-gray-300 px-3 py-2 text-center">{candidate.rank}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="flex flex-row items-center">
          <button
            onClick={handleSaveMayor}
            disabled={lockedTables.has("mayor")}
            className={`mt-4 px-4 py-2 rounded shadow ${
              lockedTables.has("mayor")
                ? "bg-gray-400 text-white cursor-not-allowed"
                : "bg-blue-600 text-white hover:bg-blue-700"
            }`}
          >
            บันทึกผล นายก
          </button>
          <button
            onClick={() => {
              setLockedTables(prev => {
                const newSet = new Set(prev);
                const newTimestamps = new Map(lockedTimestamps);
                if (newSet.has("mayor")) {
                  newSet.delete("mayor");
                  newTimestamps.delete("mayor");
                } else {
                  newSet.add("mayor");
                  newTimestamps.set("mayor", new Date().toLocaleString("th-TH", { hour12: false }) + " น.");
                }
                setLockedTimestamps(newTimestamps);
                return newSet;
              });
            }}
            className="mt-4 ml-2 bg-gray-700 text-white px-4 py-2 rounded shadow hover:bg-gray-800"
          >
            {lockedTables.has("mayor") ? "ปลดล็อคนับคะแนน นายก" : "ปิดนับคะแนน นายก"}
          </button>
        </div>
      </div>

      {/* ======= สท. ======= */}
      {data!.council.map((district, districtIdx) => (
        <div key={districtIdx} className={`mb-12 border-4 rounded-lg ${
          focusedTable === districtIdx
            ? "border-purple-500"
            : modifiedTables.has(districtIdx)
            ? "border-orange-400"
            : "border-transparent"
        }`}>
          <h2 className="text-2xl font-semibold mb-4 flex items-center justify-between">
            <span className="flex items-center">
              {focusedTable === districtIdx && <span className="animate-pulse text-purple-500 mr-2">#</span>}
              เขตเลือกตั้งที่ {districtIdx + 1}
              <UserRoundPen
                size={20}
                className="ml-2 text-blue-600 cursor-pointer"
                onClick={() => {
                  setEditingCandidate({ type: "council", districtIdx, candidateIdx: 0 });
                }}
              />
              {lockedTables.has(districtIdx) ? (
                <Lock size={20} className="ml-2 text-red-500" />
              ) : (
                <Unlock size={20} className="ml-2 text-green-500" />
              )}
            </span>
            <span className="text-sm text-gray-600">
              {lockedTimestamps.get(districtIdx) && `ปิดนับเวลา: ${lockedTimestamps.get(districtIdx)}`}
            </span>
          </h2>
          <table className="w-full table-fixed bg-white text-black border border-gray-300 divide-y divide-gray-200 shadow-md rounded-lg text-sm leading-normal">
            <thead className="bg-gray-100">
              <tr>
                <th className="border border-gray-300 px-3 py-2 whitespace-normal text-center">
                  หมาย<br />เลข
                </th>
                <th className="border border-gray-300 px-3 py-2 whitespace-nowrap text-center">ชื่อ-นามสกุล</th>
                {district.candidates[0].votes.map((_, unitIdx) => (
                  <th
                    key={unitIdx}
                    className={`border border-gray-300 px-3 py-2 whitespace-nowrap text-center ${
                      (modifiedUnits.get(districtIdx)?.has(unitIdx)) ? "bg-orange-300 animate-pulse" : ""
                    } group-hover:bg-purple-100`}
                  >
                    หน่วย {unitIdx + 1}
                  </th>
                ))}
                <th rowSpan={2} className="border border-gray-300 px-3 py-2 whitespace-normal flex items-center justify-center">
                  คะแนน<br />รวม
                </th>
                <th className="border border-gray-300 px-3 py-2 whitespace-nowrap text-center">ลำดับ</th>
              </tr>
            </thead>
            <tbody>
              {district.candidates.map((candidate, candidateIdx) => (
                <tr key={candidateIdx} className="group hover:bg-gray-50">
                  <td className="border border-gray-300 px-3 py-2 text-center">{candidateIdx + 1}</td>
                  <td className="border border-gray-300 px-3 py-2 w-40 text-center">
                    {candidate.name}
                  </td>
                  {candidate.votes.map((score, unitIdx) => (
                    <td key={unitIdx} className="border border-gray-300 px-1 py-1 group-hover:bg-purple-100">
                      <div className="flex items-center justify-center h-full">
                        <input
                          type="number"
                          min="0"
                          pattern="[0-9]*"
                          value={score === 0 ? "" : score}
                          placeholder="0"
                          disabled={lockedTables.has(districtIdx)}
                          onClick={(e) => {
                            if (lockedTables.has(districtIdx)) {
                              e.preventDefault();
                              alert(`เขต ${districtIdx + 1} ถูกปิดนับคะแนนแล้ว`);
                            }
                          }}
                          onKeyDown={(e) => {
                            if (e.key === '-' || e.key === '+' || e.key === 'e') {
                              e.preventDefault();
                            }
                          }}
                          onFocus={() => setFocusedTable(districtIdx)}
                          onBlur={() => setFocusedTable(null)}
                          onChange={(e) =>
                            handleCouncilVoteChange(districtIdx, candidateIdx, unitIdx, e.target.value)
                          }
                          className="border border-gray-300 rounded px-2 py-2 w-20 text-center text-base focus:outline-none focus:ring-2 focus:ring-blue-400"
                        />
                      </div>
                    </td>
                  ))}
                  <td className="border border-gray-300 px-3 py-4 text-center text-lg font-semibold">{candidate.total}</td>
                  <td className="border border-gray-300 px-3 py-2 text-center">{candidate.rank}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="flex flex-row items-center">
            <button
              onClick={() => handleSaveCouncil(districtIdx)}
              disabled={lockedTables.has(districtIdx)}
              className={`mt-4 px-4 py-2 rounded shadow ${
                lockedTables.has(districtIdx)
                  ? "bg-gray-400 text-white cursor-not-allowed"
                  : "bg-green-600 text-white hover:bg-green-700"
              }`}
            >
              บันทึกผล เขต {districtIdx + 1}
            </button>
            <button
              onClick={() => {
                setLockedTables(prev => {
                  const newSet = new Set(prev);
                  const newTimestamps = new Map(lockedTimestamps);
                  if (newSet.has(districtIdx)) {
                    newSet.delete(districtIdx);
                    newTimestamps.delete(districtIdx);
                  } else {
                    newSet.add(districtIdx);
                    newTimestamps.set(districtIdx, new Date().toLocaleString("th-TH", { hour12: false }) + " น.");
                  }
                  setLockedTimestamps(newTimestamps);
                  return newSet;
                });
              }}
              className="mt-4 ml-2 bg-gray-700 text-white px-4 py-2 rounded shadow hover:bg-gray-800"
            >
              {lockedTables.has(districtIdx) ? `ปลดล็อคนับคะแนน เขต ${districtIdx + 1}` : `ปิดนับคะแนน เขต ${districtIdx + 1}`}
            </button>
          </div>
        </div>
      ))}

      {/* Modal แก้ชื่อผู้สมัครนายก (ใหม่: แก้ได้ทั้ง 3 คน) */}
      {editingCandidate && editingCandidate.type === "mayor" && (
        <div className="fixed inset-0 flex items-center justify-center z-50">
          <div className="bg-white p-4 rounded shadow-lg w-96 border">
            <h2 className="text-lg font-semibold mb-4 flex items-center">
              <Edit3 className="inline-block mr-2 text-blue-600" /> แก้ไขชื่อผู้สมัครนายก
            </h2>
            <div className="space-y-2">
              {data!.mayor.map((c, idx) => (
                <div key={idx}>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    หมายเลข {idx + 1}
                  </label>
                  <input
                    type="text"
                    value={c.name}
                    onChange={(e) => {
                      const updatedMayor = [...data!.mayor];
                      updatedMayor[idx].name = e.target.value;
                      setData({ ...data!, mayor: updatedMayor });
                    }}
                    className="w-full border px-2 py-1 rounded"
                  />
                </div>
              ))}
            </div>
            <div className="flex justify-end space-x-2 mt-4">
              <button
                onClick={() => setEditingCandidate(null)}
                className="px-3 py-1 bg-gray-300 rounded"
              >
                ยกเลิก
              </button>
              <button
                onClick={() => setEditingCandidate(null)}
                className="px-3 py-1 bg-blue-600 text-white rounded"
              >
                บันทึก
              </button>
            </div>
          </div>
        </div>
      )}

      {editingCandidate && editingCandidate.type === "council" && editingCandidate.districtIdx !== undefined && (
        <div className="fixed inset-0 flex items-center justify-center z-50">
          <div className="bg-white p-4 rounded shadow-lg w-96 border">
            <h2 className="text-lg font-semibold mb-4 flex items-center">
              <Edit3 className="inline-block mr-2 text-blue-600" /> แก้ไขชื่อผู้สมัคร เขต {editingCandidate.districtIdx + 1}
            </h2>
            <div className="space-y-2">
              {data!.council[editingCandidate.districtIdx!].candidates.map((c, idx) => (
                <div key={idx}>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    หมายเลข {idx + 1}
                  </label>
                  <input
                    type="text"
                    value={c.name}
                    onChange={(e) => {
                      const updatedCouncil = [...data!.council];
                      updatedCouncil[editingCandidate.districtIdx!].candidates[idx].name = e.target.value;
                      setData({ ...data!, council: updatedCouncil });
                    }}
                    className="w-full border px-2 py-1 rounded"
                  />
                </div>
              ))}
            </div>
            <div className="flex justify-end space-x-2 mt-4">
              <button
                onClick={() => setEditingCandidate(null)}
                className="px-3 py-1 bg-gray-300 rounded"
              >
                ยกเลิก
              </button>
              <button
                onClick={() => setEditingCandidate(null)}
                className="px-3 py-1 bg-blue-600 text-white rounded"
              >
                บันทึก
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}