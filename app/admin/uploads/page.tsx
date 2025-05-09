"use client";
import { useEffect, useState } from "react";

interface Candidate {
  _id: string;
  type: string;
  index?: number;
  districtIdx?: number;
  candidateIdx?: number;
  name: string;
  image?: string;
}

export default function UploadPage() {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingCandidate, setEditingCandidate] = useState<Candidate | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [newName, setNewName] = useState("");
  const [newImage, setNewImage] = useState("");

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

  const openEditModal = (candidate: Candidate) => {
    setEditingCandidate(candidate);
    setNewName(candidate.name);
    setNewImage(candidate.image || "");
    setShowModal(true);
  };

  if (loading) return <p>Loading...</p>;

  const mayorCandidates = candidates
    .filter((c) => c.type === "mayor")
    .sort((a, b) => (a.index ?? 0) - (b.index ?? 0));

  const councilCandidates = (districtIdx: number) =>
    candidates
      .filter((c) => c.type === "council" && c.districtIdx === districtIdx)
      .sort((a, b) => (a.candidateIdx ?? 0) - (b.candidateIdx ?? 0));

  return (
    <div className="p-4 space-y-8">
      <div>
        <h1 className="text-2xl font-bold mb-4">ผู้สมัครนายก</h1>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {mayorCandidates.map((candidate) => (
            <div key={candidate._id} className="border rounded-lg shadow p-4 flex flex-col items-center">
              <img
                src={candidate.image || "/placeholder.png"}
                alt={candidate.name}
                className="w-32 h-32 object-cover rounded-full mb-2"
              />
              <h2 className="font-semibold text-lg text-center">{candidate.name}</h2>
              <p className="text-sm text-gray-500">เบอร์ {candidate.index! + 1}</p>
              <button
                onClick={() => openEditModal(candidate)}
                className="mt-2 px-3 py-1 bg-yellow-500 text-black rounded hover:bg-yellow-600">แก้ไข</button>
            </div>
          ))}
        </div>
      </div>

      {[0, 1, 2].map((district) => (
        <div key={district}>
          <h1 className="text-2xl font-bold mb-4">ผู้สมัคร สท เขต {district + 1}</h1>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {councilCandidates(district).map((candidate) => (
              <div key={candidate._id} className="border rounded-lg shadow p-4 flex flex-col items-center">
                <img
                  src={candidate.image || "/placeholder.png"}
                  alt={candidate.name}
                  className="w-32 h-32 object-cover rounded-full mb-2"
                />
                <h2 className="font-semibold text-lg text-center">{candidate.name}</h2>
                <p className="text-sm text-gray-500">เขต {candidate.districtIdx! + 1} เบอร์ {candidate.candidateIdx! + 1}</p>
                <button
                  onClick={() => openEditModal(candidate)}
                  className="mt-2 px-3 py-1 bg-yellow-500 text-black rounded hover:bg-yellow-600">แก้ไข</button>
              </div>
            ))}
          </div>
        </div>
      ))}

      {showModal && editingCandidate && (
        <div className="fixed inset-0 bg-black bg-opacity-30 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded shadow-lg w-80 relative text-black">
            <h2 className="text-lg font-bold mb-4 text-center text-black">แก้ไขข้อมูลผู้สมัคร</h2>
            <label className="block text-sm mb-1 text-black">ชื่อผู้สมัคร</label>
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="w-full border rounded px-2 py-1 mb-3"
            />
            <label className="block text-sm mb-1 text-black">อัพโหลดรูปภาพ</label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  const reader = new FileReader();
                  reader.onloadend = () => {
                    setNewImage(reader.result as string);
                  };
                  reader.readAsDataURL(file);
                }
              }}
              className="w-full mb-3"
            />
            {newImage && <img src={newImage} alt="preview" className="w-24 h-24 object-cover rounded-full mx-auto mb-3" />}
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowModal(false)}
                className="px-3 py-1 bg-gray-300 rounded">ยกเลิก</button>
              <button
                onClick={async () => {
                  const res = await fetch(`/api/candidates/${editingCandidate._id}`, {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ name: newName, image: newImage }),
                  });
                  if (res.ok) {
                    const updated = candidates.map((c) => c._id === editingCandidate._id ? { ...c, name: newName, image: newImage } : c);
                    setCandidates(updated);
                    setShowModal(false);
                  } else {
                    alert("เกิดข้อผิดพลาดในการบันทึก");
                  }
                }}
                className="px-3 py-1 bg-blue-500 text-white rounded">บันทึก</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}