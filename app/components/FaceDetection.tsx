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
