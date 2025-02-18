# Face Expression Recognition App with Next.js and face-api.js

This project demonstrates how to build a real-time facial expression recognition application using Next.js and face-api.js. The app uses your webcam to detect faces and analyze expressions in real-time.

## Prerequisites

- Node.js (version 16 or higher)
- npm or yarn
- A modern web browser
- A webcam

## Step 1: Create a New Next.js Project

First, create a new Next.js project with TypeScript and Tailwind CSS:

```bash
npx create-next-app@latest face-recognition --typescript --tailwind --eslint
cd face-recognition
```

## Step 2: Install Dependencies

Install the required dependencies:

```bash
# Install face-api.js for facial recognition
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

## Step 4: Create the FaceDetection Component

Create a new file at `app/components/FaceDetection.tsx`:

```typescript
"use client";

import { useEffect, useRef, useState } from "react";
import * as faceapi from "face-api.js";

export default function FaceDetection() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);

  useEffect(() => {
    const loadModels = async () => {
      const MODEL_URL = "/models";

      console.log("Starting to load models...");
      try {
        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
          faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL),
        ]);
        console.log("Models loaded successfully!");
        setModelsLoaded(true);
      } catch (error) {
        console.error("Error loading models:", error);
      }
    };

    loadModels();

    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [stream]);

  useEffect(() => {
    const startVideo = async () => {
      console.log("Starting video...");
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: 640,
            height: 480,
          },
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          setStream(stream);
          console.log("Video stream set successfully!");
        }
      } catch (error) {
        console.error("Error accessing webcam:", error);
      }
    };

    if (modelsLoaded) {
      startVideo();
    }
  }, [modelsLoaded]);

  const handleVideoPlay = () => {
    console.log("Video started playing");
    setIsVideoPlaying(true);
    if (canvasRef.current) {
      canvasRef.current.width = videoRef.current?.videoWidth || 640;
      canvasRef.current.height = videoRef.current?.videoHeight || 480;
    }
  };

  useEffect(() => {
    let animationFrameId: number;

    const detectExpressions = async () => {
      if (!videoRef.current || !canvasRef.current || !isVideoPlaying) {
        console.log("Video or canvas not ready, or video not playing");
        return;
      }

      const video = videoRef.current;
      const canvas = canvasRef.current;

      console.log("Starting detection...");
      const detection = await faceapi
        .detectSingleFace(video, new faceapi.TinyFaceDetectorOptions())
        .withFaceExpressions();

      if (detection) {
        console.log("Face detected!");
        const context = canvas.getContext("2d");
        if (!context) return;

        // Clear previous drawings
        context.clearRect(0, 0, canvas.width, canvas.height);

        // Draw detection box
        const dims = faceapi.matchDimensions(canvas, video, true);
        const resizedDetection = faceapi.resizeResults(detection, dims);
        faceapi.draw.drawDetections(canvas, [resizedDetection]);

        // Get the dominant expression
        const expressions = detection.expressions;
        console.log("All expressions:", expressions);
        const dominantExpression = Object.entries(expressions).reduce((a, b) =>
          a[1] > b[1] ? a : b
        );
        console.log(
          "Dominant expression:",
          dominantExpression[0],
          dominantExpression[1]
        );

        // Draw the expression text
        context.font = "24px Arial";
        context.fillStyle = "#00ff00";
        context.strokeStyle = "#000000";
        context.lineWidth = 3;

        const text = `${dominantExpression[0]}: ${Math.round(
          dominantExpression[1] * 100
        )}%`;
        const textWidth = context.measureText(text).width;
        const x = (canvas.width - textWidth) / 2;

        context.strokeText(text, x, 50);
        context.fillText(text, x, 50);
      } else {
        console.log("No face detected");
      }

      // Continue detection
      animationFrameId = requestAnimationFrame(detectExpressions);
    };

    if (modelsLoaded && isVideoPlaying) {
      console.log("Starting detection loop");
      detectExpressions();
    }

    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, [modelsLoaded, isVideoPlaying]);

  return (
    <div className="relative">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="min-h-[480px] min-w-[640px]"
        onPlay={handleVideoPlay}
      />
      <canvas ref={canvasRef} className="absolute top-0 left-0" />
      {!modelsLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 text-white">
          Loading models...
        </div>
      )}
    </div>
  );
}
```

## Step 5: Update the Main Page

Update `app/page.tsx` to use the FaceDetection component:

```typescript
import FaceDetection from "./components/FaceDetection";

export default function Home() {
  return (
    <main className="min-h-screen p-8 flex flex-col items-center">
      <h1 className="text-3xl font-bold mb-8">Face Expression Recognition</h1>
      <div className="w-full max-w-3xl mx-auto">
        <FaceDetection />
      </div>
    </main>
  );
}
```

## Step 6: Download Face-API.js Models

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

## Step 7: Run the Application

Start the development server:

```bash
npm run dev
```

Visit `http://localhost:3000` in your browser. Allow webcam access when prompted.

## How It Works

### Key Components

1. **face-api.js**: A JavaScript API for face detection and recognition in the browser, built on top of TensorFlow.js.

2. **TinyFaceDetector**: A lightweight face detection model optimized for performance.

3. **FaceExpressionNet**: A model that can recognize seven different facial expressions:
   - Neutral
   - Happy
   - Sad
   - Angry
   - Fearful
   - Disgusted
   - Surprised

### Component Structure

The `FaceDetection` component uses several React hooks:

1. **useRef**: For video and canvas element references
2. **useState**: For tracking model loading and video states
3. **useEffect**: For handling:
   - Model loading
   - Video stream initialization
   - Face detection loop

### Detection Process

1. Loads the required face-api.js models
2. Initializes webcam stream
3. Continuously detects faces and expressions using requestAnimationFrame
4. Draws detection boxes and expression text on a canvas overlay

## Troubleshooting

1. Make sure your webcam is properly lit
2. Face should be clearly visible and centered
3. Check browser console for debugging logs
4. Ensure all model files are properly downloaded
5. Check that webcam permissions are granted

## Dependencies Explained

- **face-api.js**: Provides face detection and expression recognition functionality
- **encoding**: Required for Node.js polyfills in the browser environment
- **TypeScript**: For type safety and better development experience
- **Tailwind CSS**: For styling the application

## Browser Support

This application works best in modern browsers with webcam support. Ensure your browser:

- Supports WebRTC (for webcam access)
- Has sufficient WebGL support for TensorFlow.js
- Allows webcam access permissions
