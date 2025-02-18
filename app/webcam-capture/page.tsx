"use client";

import Link from "next/link";
import WebcamCapture from "../components/WebcamCapture";

export default function WebcamCapturePage() {
  return (
    <main className="min-h-screen p-8 flex flex-col items-center">
      <div className="w-full max-w-3xl mx-auto">
        <div className="mb-8 flex justify-between items-center">
          <h1 className="text-3xl font-bold">Simple Webcam Capture</h1>
          <Link
            href="/"
            className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600 transition-colors"
          >
            Back to Home
          </Link>
        </div>
        <WebcamCapture />
      </div>
    </main>
  );
}
