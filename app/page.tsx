import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen p-8 flex flex-col items-center">
      <h1 className="text-3xl font-bold mb-8">Webcam Applications</h1>
      <div className="w-full max-w-3xl mx-auto flex flex-col gap-6">
        <Link
          href="/face-detection"
          className="bg-blue-500 text-white p-6 rounded-lg hover:bg-blue-600 transition-colors"
        >
          <h2 className="text-xl font-semibold mb-2">
            Face Expression Recognition
          </h2>
          <p className="text-blue-100">
            Use AI to detect faces and recognize expressions in real-time using
            your webcam.
          </p>
        </Link>

        <Link
          href="/webcam-capture"
          className="bg-green-500 text-white p-6 rounded-lg hover:bg-green-600 transition-colors"
        >
          <h2 className="text-xl font-semibold mb-2">Simple Webcam Capture</h2>
          <p className="text-green-100">
            Take photos using your webcam with a simple interface.
          </p>
        </Link>
      </div>
    </main>
  );
}
