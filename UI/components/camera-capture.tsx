"use client"

import { useEffect, useRef, useState } from "react"
import { Camera, X, FlipHorizontal, CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface CameraCaptureProps {
  onCapture: (imageDataUrl: string, file: File) => void
  onClose: () => void
}

export function CameraCapture({ onCapture, onClose }: CameraCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [stream, setStream] = useState<MediaStream | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [facingMode, setFacingMode] = useState<"user" | "environment">("environment")
  const [capturedImage, setCapturedImage] = useState<string | null>(null)
  const [isCapturing, setIsCapturing] = useState(false)

  useEffect(() => {
    startCamera()
    return () => stopCamera()
  }, [facingMode])

  const startCamera = async () => {
    try {
      setError(null)
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: facingMode,
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
        audio: false,
      })

      setStream(mediaStream)
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream
      }
    } catch (err) {
      console.error("Camera access error:", err)
      setError("Unable to access camera. Please check permissions.")
    }
  }

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop())
      setStream(null)
    }
  }

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return

    setIsCapturing(true)
    const video = videoRef.current
    const canvas = canvasRef.current

    // Set canvas dimensions to match video
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight

    // Draw video frame to canvas
    const context = canvas.getContext("2d")
    if (!context) return

    context.drawImage(video, 0, 0, canvas.width, canvas.height)

    // Get image data
    const imageDataUrl = canvas.toDataURL("image/jpeg", 0.9)
    setCapturedImage(imageDataUrl)
    setIsCapturing(false)
  }

  const confirmCapture = () => {
    if (!capturedImage) return

    // Convert data URL to File
    fetch(capturedImage)
      .then((res) => res.blob())
      .then((blob) => {
        const file = new File([blob], `photo-${Date.now()}.jpg`, { type: "image/jpeg" })
        onCapture(capturedImage, file)
        stopCamera()
      })
      .catch((err) => {
        console.error("Error converting image:", err)
      })
  }

  const retakePhoto = () => {
    setCapturedImage(null)
  }

  const switchCamera = () => {
    setFacingMode((prev) => (prev === "user" ? "environment" : "user"))
    setCapturedImage(null)
  }

  if (error) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4">
        <div className="flex max-w-md flex-col items-center gap-4 rounded-2xl bg-card p-6 text-center">
          <Camera className="h-12 w-12 text-destructive" />
          <h3 className="text-lg font-semibold text-foreground">Camera Access Required</h3>
          <p className="text-sm text-muted-foreground">{error}</p>
          <Button onClick={onClose} variant="outline" className="w-full">
            Close
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-50 bg-black">
      {/* Video preview or captured image */}
      <div className="relative h-full w-full">
        {capturedImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={capturedImage} alt="Captured" className="h-full w-full object-contain" />
        ) : (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="h-full w-full object-cover"
          />
        )}

        {/* Hidden canvas for capturing */}
        <canvas ref={canvasRef} className="hidden" />

        {/* Top controls */}
        <div className="absolute left-0 right-0 top-0 flex items-center justify-between p-4">
          <Button
            onClick={onClose}
            variant="ghost"
            size="icon"
            className="h-10 w-10 rounded-full bg-black/50 text-white hover:bg-black/70"
          >
            <X className="h-6 w-6" />
          </Button>

          {!capturedImage && (
            <Button
              onClick={switchCamera}
              variant="ghost"
              size="icon"
              className="h-10 w-10 rounded-full bg-black/50 text-white hover:bg-black/70"
            >
              <FlipHorizontal className="h-6 w-6" />
            </Button>
          )}
        </div>

        {/* Bottom controls */}
        <div className="absolute bottom-0 left-0 right-0 flex items-center justify-center p-8">
          {capturedImage ? (
            <div className="flex gap-4">
              <Button
                onClick={retakePhoto}
                variant="outline"
                size="lg"
                className="rounded-full bg-white/90 px-8 text-foreground hover:bg-white"
              >
                Retake
              </Button>
              <Button
                onClick={confirmCapture}
                size="lg"
                className="rounded-full bg-primary px-8 text-primary-foreground hover:bg-primary/90"
              >
                <CheckCircle2 className="mr-2 h-5 w-5" />
                Use Photo
              </Button>
            </div>
          ) : (
            <button
              onClick={capturePhoto}
              disabled={isCapturing}
              className={cn(
                "flex h-20 w-20 items-center justify-center rounded-full border-4 border-white bg-white/20 backdrop-blur-sm transition-all hover:bg-white/30 active:scale-95",
                isCapturing && "opacity-50"
              )}
              aria-label="Capture photo"
            >
              <div className="h-16 w-16 rounded-full bg-white" />
            </button>
          )}
        </div>

        {/* Camera guide overlay */}
        {!capturedImage && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <div className="h-64 w-64 rounded-2xl border-2 border-white/50 border-dashed" />
          </div>
        )}
      </div>
    </div>
  )
}
