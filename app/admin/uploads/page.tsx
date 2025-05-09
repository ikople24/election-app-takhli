"use client";

import React, { useState, useEffect } from 'react';
import { CldUploadWidget } from 'next-cloudinary';

interface UploadResult {
  info: {
    secure_url: string;
  };
}

export default function UploadCandidates() {
  const [mayorImages, setMayorImages] = useState(Array(3).fill(''));
  const [councilImages, setCouncilImages] = useState(
    Array(3).fill(0).map(() => Array(7).fill(''))
  );

  // Load images from results.json on mount
  useEffect(() => {
    fetch('/data/results.json')
      .then(res => res.json())
      .then(data => {
        setMayorImages(data.mayor.map((m: any) => m.image || ''));
        setCouncilImages(data.council.map((d: any) => d.candidates.map((c: any) => c.image || '')));
      });
  }, []);

  const handleMayorUpload = (index: number, result: UploadResult) => {
    const url = result.info.secure_url;
    const updated = [...mayorImages];
    updated[index] = url;
    setMayorImages(updated);

    fetch('/api/save-image', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'mayor', index, url }),
    })
      .then(res => res.json())
      .then(data => console.log('save-image response (mayor):', data))
      .catch(err => console.error('save-image error (mayor):', err));
  };

  const handleCouncilUpload = (districtIdx: number, candidateIdx: number, result: UploadResult) => {
    const url = result.info.secure_url;
    const updated = councilImages.map(d => [...d]);
    updated[districtIdx][candidateIdx] = url;
    setCouncilImages(updated);

    fetch('/api/save-image', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'council', districtIdx, candidateIdx, url }),
    })
      .then(res => res.json())
      .then(data => console.log('save-image response (council):', data))
      .catch(err => console.error('save-image error (council):', err));
  };

  return (
    <div className="p-4 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold text-center mb-8">อัปโหลดภาพผู้สมัคร</h1>

      <h2 className="text-2xl font-semibold mb-4">นายก</h2>
      <div className="grid grid-cols-3 gap-6 mb-12">
        {mayorImages.map((url, idx) => (
          <div key={idx} className="border rounded shadow p-4 flex flex-col items-center">
            <p className="mb-2 font-medium">ผู้สมัครนายก {idx + 1}</p>
            <CldUploadWidget
              uploadPreset={process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET}
              onUpload={(result) => handleMayorUpload(idx, result as UploadResult)}
            >
              {({ open }) => (
                <button onClick={() => open()} className="bg-blue-500 text-white px-4 py-2 rounded mb-4">
                  อัปโหลดรูป
                </button>
              )}
            </CldUploadWidget>
            {url ? (
              <img src={url} alt={`นายก ${idx + 1}`} className="h-40 object-contain rounded" />
            ) : (
              <div className="h-40 w-full bg-gray-100 flex items-center justify-center rounded text-gray-400">
                ไม่มีรูป
              </div>
            )}
          </div>
        ))}
      </div>

      {[0, 1, 2].map((districtIdx) => (
        <div key={districtIdx} className="mb-12">
          <h2 className="text-2xl font-semibold mb-4">สท. เขต {districtIdx + 1}</h2>
          <div className="grid grid-cols-7 gap-4">
            {councilImages[districtIdx].map((url, candidateIdx) => (
              <div key={candidateIdx} className="border rounded shadow p-3 flex flex-col items-center">
                <p className="mb-2 font-medium">ผู้สมัคร สท {candidateIdx + 1}</p>
                <CldUploadWidget
                  uploadPreset={process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET}
                  onUpload={(result) => handleCouncilUpload(districtIdx, candidateIdx, result as UploadResult)}
                >
                  {({ open }) => (
                    <button onClick={() => open()} className="bg-green-500 text-white px-3 py-1 rounded mb-3 text-sm">
                      อัปโหลดรูป
                    </button>
                  )}
                </CldUploadWidget>
                {url ? (
                  <img src={url} alt={`สท เขต${districtIdx + 1}-${candidateIdx + 1}`} className="h-28 object-contain rounded" />
                ) : (
                  <div className="h-28 w-full bg-gray-100 flex items-center justify-center rounded text-gray-400 text-xs">
                    ไม่มีรูป
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* 💡 ตรวจสอบว่า .env.local มีค่า:
        NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=your_preset_name
        NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloud_name
      */}
    </div>
  );
}
