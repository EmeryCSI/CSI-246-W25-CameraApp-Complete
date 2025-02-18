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
