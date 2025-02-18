# Webcam Applications with Next.js

This project demonstrates how to build two webcam-based applications using Next.js:

1. A simple webcam photo capture application
2. A real-time facial expression recognition application using face-api.js

https://justadudewhohacks.github.io/face-api.js/docs/index.html#tutorials

https://itnext.io/face-api-js-javascript-api-for-face-recognition-in-the-browser-with-tensorflow-js-bcc2a6c4cf07

## Prerequisites

- Node.js (version 16 or higher)
- npm or yarn
- A modern web browser
- A webcam

## Step 1: Create a New Next.js Project

First, create a new Next.js project with TypeScript and Tailwind CSS:

```bash
npx create-next-app@latest webcam-apps --typescript --tailwind --eslint
cd webcam-apps
```

## Step 2: Install Dependencies

Install the required dependencies:

```bash
# Install face-api.js for facial recognition (needed for the second component)
npm install face-api.js

# Install additional dependencies for Node.js polyfills
npm install encoding
```

## Step 3: Configure Next.js

Create or update `next.config.ts` to handle Node.js module polyfills:

```typescript
import type { Configuration } from "webpack";

/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config: Configuration) => {
    config.resolve = config.resolve || {};
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      encoding: false,
      "node-fetch": false,
    };
    return config;
  },
};

export default nextConfig;
```

## Step 4: Create the Directory Structure

Create the necessary directories:

```bash
mkdir -p app/components
mkdir -p app/webcam-capture
mkdir -p app/face-detection
mkdir -p public/captured-photos
```

## Step 5: Create the WebcamCapture Component

Create `app/components/WebcamCapture.tsx`:

```typescript
"use client";

import { useEffect, useRef, useState } from "react";

export default function WebcamCapture() {
  // === REFS AND STATE MANAGEMENT ===
  // videoRef: Connects to the actual video element in the DOM to control the webcam feed
  const videoRef = useRef<HTMLVideoElement>(null);
  // canvasRef: Used as a temporary drawing surface to capture frames from the video
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // stream: Holds the active webcam stream. Needed to properly start/stop webcam access
  const [stream, setStream] = useState<MediaStream | null>(null);
  // capturedImage: Stores the photo after it's taken (as a base64 string)
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  // isSaving: Tracks whether we're currently saving a photo (for UI feedback)
  const [isSaving, setIsSaving] = useState(false);
  // savedFileName: Stores the filename after a successful save
  const [savedFileName, setSavedFileName] = useState<string | null>(null);

  // === WEBCAM HANDLING ===
  // Function to start or restart the webcam stream
  const startVideo = async () => {
    try {
      // Safety check: If there's an existing stream, stop it first
      // This prevents memory leaks and ensures we don't have multiple streams
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }

      // Request access to the user's webcam
      // The getUserMedia API returns a stream when the user grants permission
      const newStream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: 640, // Request specific dimensions for consistency
          height: 480,
        },
      });

      // If we have our video element, connect the stream to it
      if (videoRef.current) {
        videoRef.current.srcObject = newStream; // This makes the webcam feed appear
        setStream(newStream); // Save the stream for later cleanup
      }
    } catch (error) {
      console.error("Error accessing webcam:", error);
    }
  };

  // === COMPONENT LIFECYCLE ===
  // This effect runs when the component first mounts
  useEffect(() => {
    startVideo(); // Start the webcam when the component loads

    // Cleanup function that runs when the component unmounts
    // This ensures we stop using the webcam when we leave the page
    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, []); // Empty dependency array means this only runs once on mount

  // === PHOTO CAPTURE FUNCTIONALITY ===
  // Function to take a photo from the current video frame
  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;

      // Set the canvas size to match the video size for accurate capture
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      // Get the canvas context for drawing
      const context = canvas.getContext("2d");
      if (context) {
        // Draw the current video frame onto the canvas
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        // Convert the canvas content to a base64-encoded PNG image
        const imageDataUrl = canvas.toDataURL("image/png");
        setCapturedImage(imageDataUrl); // Store the captured image
        setSavedFileName(null); // Reset any previous save state
      }
    }
  };

  // === SAVE FUNCTIONALITY ===
  // Function to save the captured photo to the server
  const savePhoto = async () => {
    if (!capturedImage) return; // Safety check

    try {
      setIsSaving(true); // Show saving indicator in UI
      // Send the image to our API endpoint
      const response = await fetch("/api/save-image", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ image: capturedImage }), // Send the base64 image data
      });

      const data = await response.json();
      if (data.success) {
        setSavedFileName(data.fileName); // Store the filename for display
      } else {
        console.error("Failed to save image");
      }
    } catch (error) {
      console.error("Error saving image:", error);
    } finally {
      setIsSaving(false); // Hide saving indicator
    }
  };

  // === RETAKE FUNCTIONALITY ===
  // Function to reset the capture process and start over
  const retake = async () => {
    setCapturedImage(null); // Clear the current photo
    setSavedFileName(null); // Clear the saved state
    await startVideo(); // Restart the webcam feed
  };

  // === UI RENDERING ===
  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative">
        {/* Conditional rendering: Show either the live camera feed or the captured photo */}
        {!capturedImage ? (
          // === CAMERA MODE ===
          <>
            {/* Live video feed from webcam */}
            <video
              ref={videoRef}
              autoPlay // Start playing automatically
              playsInline // Better mobile support
              muted // Disable audio
              className="min-h-[480px] min-w-[640px]"
            />
            {/* Capture button */}
            <button
              onClick={capturePhoto}
              className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-blue-500 text-white px-4 py-2 rounded-full hover:bg-blue-600 transition-colors"
            >
              Take Photo
            </button>
          </>
        ) : (
          // === REVIEW MODE ===
          <>
            {/* Display the captured photo */}
            <img
              src={capturedImage}
              alt="Captured"
              className="min-h-[480px] min-w-[640px]"
            />
            {/* Action buttons container */}
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-4">
              {/* Retake button */}
              <button
                onClick={retake}
                className="bg-blue-500 text-white px-4 py-2 rounded-full hover:bg-blue-600 transition-colors"
              >
                Retake Photo
              </button>
              {/* Save button with dynamic states */}
              <button
                onClick={savePhoto}
                disabled={isSaving || savedFileName !== null}
                className={`bg-green-500 text-white px-4 py-2 rounded-full transition-colors ${
                  isSaving || savedFileName !== null
                    ? "opacity-50 cursor-not-allowed"
                    : "hover:bg-green-600"
                }`}
              >
                {/* Dynamic button text based on current state */}
                {isSaving
                  ? "Saving..."
                  : savedFileName
                  ? "Saved!"
                  : "Save Photo"}
              </button>
            </div>
            {/* Success message showing the saved filename */}
            {savedFileName && (
              <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-green-100 text-green-800 px-4 py-2 rounded-lg">
                Saved as: {savedFileName}
              </div>
            )}
          </>
        )}
      </div>
      {/* Hidden canvas used for image capture */}
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}
```

## Step 6: Create the API Route for Saving Images

Create `app/api/save-image/route.ts`:

```typescript
import { NextResponse } from "next/server";
import { writeFile } from "fs/promises";
import { join } from "path";
import crypto from "crypto";

// API route handler for POST requests to /api/save-image
export async function POST(req: Request) {
  try {
    // Parse the JSON body from the request
    const data = await req.json();
    const { image } = data;

    // Generate a secure random filename to prevent collisions
    // Uses 16 bytes of random data converted to hexadecimal (32 characters)
    const randomName = crypto.randomBytes(16).toString("hex");
    const fileName = `${randomName}.png`;

    // Remove the data URL prefix from the base64 string
    // Example prefix: "data:image/png;base64,"
    const base64Data = image.replace(/^data:image\/\w+;base64,/, "");

    // Convert the base64 string to a buffer for file writing
    const buffer = Buffer.from(base64Data, "base64");

    // Construct the path to save the file
    // process.cwd() gets the current working directory
    // Files are saved to public/captured-photos for easy access via URL
    const publicPath = join(process.cwd(), "public", "captured-photos");

    // Write the file to disk
    await writeFile(join(publicPath, fileName), buffer);

    // Return success response with the generated filename
    return NextResponse.json({ success: true, fileName });
  } catch (error) {
    // Log the error for debugging
    console.error("Error saving image:", error);

    // Return error response with 500 status code
    return NextResponse.json(
      { success: false, error: "Failed to save image" },
      { status: 500 }
    );
  }
}
```

## Step 7: Create the WebcamCapture Page

Create `app/webcam-capture/page.tsx`:

```typescript
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
```

## Step 8: Create the FaceDetection Component

Create `app/components/FaceDetection.tsx`:

```typescript
"use client";

import { useEffect, useRef, useState } from "react";
import * as faceapi from "face-api.js";

export default function FaceDetection() {
  // === REFS AND STATE MANAGEMENT ===
  // videoRef: Connects to the actual video element showing the webcam feed
  const videoRef = useRef<HTMLVideoElement>(null);
  // canvasRef: Used as an overlay to draw facial detection boxes and expressions
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // State to track whether AI models are loaded
  const [modelsLoaded, setModelsLoaded] = useState(false);
  // Stores the active webcam stream for cleanup
  const [stream, setStream] = useState<MediaStream | null>(null);
  // Tracks if video is currently playing (needed for accurate detection)
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);

  // === MODEL LOADING ===
  useEffect(() => {
    // Function to load the required AI models for face detection
    const loadModels = async () => {
      const MODEL_URL = "/models"; // Path to model files in public directory

      console.log("Starting to load models...");
      try {
        // Load both models in parallel for better performance
        await Promise.all([
          // TinyFaceDetector: A lightweight model for finding faces in images
          faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
          // FaceExpressionNet: Model for detecting facial expressions
          faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL),
        ]);
        console.log("Models loaded successfully!");
        setModelsLoaded(true);
      } catch (error) {
        console.error("Error loading models:", error);
      }
    };

    loadModels(); // Start loading models when component mounts

    // Cleanup: Stop webcam when component unmounts
    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, []); // Empty dependency array means this only runs once on mount

  // === WEBCAM INITIALIZATION ===
  useEffect(() => {
    // Function to start the webcam feed
    const startVideo = async () => {
      console.log("Starting video...");
      try {
        // Request webcam access with specific dimensions
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: 640,
            height: 480,
          },
        });

        // Connect the stream to the video element
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          setStream(stream);
          console.log("Video stream set successfully!");
        }
      } catch (error) {
        console.error("Error accessing webcam:", error);
      }
    };

    // Only start video if models are loaded
    if (modelsLoaded) {
      startVideo();
    }
  }, [modelsLoaded]); // Run when models finish loading

  // === VIDEO PLAYBACK HANDLING ===
  // Called when the video element starts playing
  const handleVideoPlay = () => {
    console.log("Video started playing");
    setIsVideoPlaying(true);

    // Set canvas dimensions to match video
    if (canvasRef.current) {
      canvasRef.current.width = videoRef.current?.videoWidth || 640;
      canvasRef.current.height = videoRef.current?.videoHeight || 480;
    }
  };

  // === FACE DETECTION LOOP ===
  useEffect(() => {
    let animationFrameId: number; // Store the animation frame ID for cleanup

    // Function to detect faces and expressions in each frame
    const detectExpressions = async () => {
      // Only run if we have all required elements and video is playing
      if (!videoRef.current || !canvasRef.current || !isVideoPlaying) {
        console.log("Video or canvas not ready, or video not playing");
        return;
      }

      const video = videoRef.current;
      const canvas = canvasRef.current;

      console.log("Starting detection...");
      // Detect a single face and its expressions
      const detection = await faceapi
        .detectSingleFace(video, new faceapi.TinyFaceDetectorOptions())
        .withFaceExpressions();

      if (detection) {
        console.log("Face detected!");
        const context = canvas.getContext("2d");
        if (!context) return;

        // Clear previous drawings
        context.clearRect(0, 0, canvas.width, canvas.height);

        // Resize detection to match display dimensions
        const dims = faceapi.matchDimensions(canvas, video, true);
        const resizedDetection = faceapi.resizeResults(detection, dims);

        // Draw box around detected face
        faceapi.draw.drawDetections(canvas, [resizedDetection]);

        // Process and display expression results
        const expressions = detection.expressions;
        console.log("All expressions:", expressions);
        // Find the most confident expression
        const dominantExpression = Object.entries(expressions).reduce((a, b) =>
          a[1] > b[1] ? a : b
        );
        console.log(
          "Dominant expression:",
          dominantExpression[0],
          dominantExpression[1]
        );

        // Draw the expression text with a nice style
        context.font = "24px Arial";
        context.fillStyle = "#00ff00"; // Bright green color
        context.strokeStyle = "#000000"; // Black outline
        context.lineWidth = 3;

        // Format the text with percentage
        const text = `${dominantExpression[0]}: ${Math.round(
          dominantExpression[1] * 100
        )}%`;
        // Center the text
        const textWidth = context.measureText(text).width;
        const x = (canvas.width - textWidth) / 2;

        // Draw text with outline for better visibility
        context.strokeText(text, x, 50);
        context.fillText(text, x, 50);
      } else {
        console.log("No face detected");
      }

      // Schedule the next frame detection
      animationFrameId = requestAnimationFrame(detectExpressions);
    };

    // Start the detection loop if everything is ready
    if (modelsLoaded && isVideoPlaying) {
      console.log("Starting detection loop");
      detectExpressions();
    }

    // Cleanup: Cancel the animation frame when component updates or unmounts
    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, [modelsLoaded, isVideoPlaying]); // Run when models load or video state changes

  // === UI RENDERING ===
  return (
    <div className="relative">
      {/* Video element for webcam feed */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="min-h-[480px] min-w-[640px]"
        onPlay={handleVideoPlay}
      />
      {/* Canvas overlay for drawing detection results */}
      <canvas ref={canvasRef} className="absolute top-0 left-0" />
      {/* Loading overlay while models are being loaded */}
      {!modelsLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 text-white">
          Loading models...
        </div>
      )}
    </div>
  );
}
```

## Step 9: Create the FaceDetection Page

Create `app/face-detection/page.tsx`:

```typescript
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
```

## Step 10: Create the Home Page

Update `app/page.tsx`:

```typescript
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
```

## Step 11: Download Face-API.js Models

1. Create a models directory in the public folder:

```bash
mkdir -p public/models
```

2. Download the required model files:

```bash
cd public/models
# Download TinyFaceDetector model files
curl -O https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights/tiny_face_detector_model-weights_manifest.json
curl -O https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights/tiny_face_detector_model-shard1

# Download Face Expression model files
curl -O https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights/face_expression_model-weights_manifest.json
curl -O https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights/face_expression_model-shard1
```

## Step 12: Run the Application

Start the development server:

```bash
npm run dev
```

Visit `http://localhost:3000` in your browser. You'll see two options:

1. Simple Webcam Capture - For taking and saving photos
2. Face Expression Recognition - For real-time facial expression detection

## Features

### WebcamCapture Component

- Live webcam feed
- Photo capture functionality
- Save photos with random filenames
- Retake option
- Visual feedback for saving process

### FaceDetection Component

- Real-time face detection
- Expression recognition (7 different expressions)
- Visual feedback with detection box
- Expression confidence percentage
- Loading state for AI models

## Troubleshooting

1. Make sure your webcam is properly lit
2. Face should be clearly visible and centered
3. Check browser console for debugging logs
4. Ensure all model files are properly downloaded
5. Check that webcam permissions are granted

## Browser Support

This application works best in modern browsers with webcam support. Ensure your browser:

- Supports WebRTC (for webcam access)
- Has sufficient WebGL support for TensorFlow.js
- Allows webcam access permissions
