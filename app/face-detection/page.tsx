"use client";

import Link from "next/link";
import FaceDetection from "../components/FaceDetection";

export default function FaceDetectionPage() {
  return (
    <main className="min-h-screen p-8 flex flex-col items-center">
      <div className="w-full max-w-3xl mx-auto">
        <div className="mb-8 flex justify-between items-center">
          <h1 className="text-3xl font-bold">Face Expression Recognition</h1>
          <Link
            href="/"
            className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600 transition-colors"
          >
            Back to Home
          </Link>
        </div>
        <FaceDetection />
      </div>
    </main>
  );
}
