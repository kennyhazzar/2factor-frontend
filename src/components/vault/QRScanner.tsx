"use client";

import { useEffect, useRef, useState } from "react";
import jsQR from "jsqr";
import { useTranslations } from "next-intl";
import { Loader2Icon, CameraOffIcon } from "lucide-react";

interface QRScannerProps {
  onScan: (uri: string) => void;
  onError: (message: string) => void;
}

export function QRScanner({ onScan, onError }: QRScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);
  const streamRef = useRef<MediaStream | null>(null);
  const [isStarting, setIsStarting] = useState(true);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const t = useTranslations("vault");

  useEffect(() => {
    let cancelled = false;

    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment" },
        });

        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }

        streamRef.current = stream;
        const video = videoRef.current;
        if (!video) return;

        video.srcObject = stream;
        await video.play();
        setIsStarting(false);
        scanFrame();
      } catch {
        if (!cancelled) {
          setCameraError(t("noCameraAccess"));
          onError(t("noCameraAccessDetail"));
        }
      }
    };

    const scanFrame = () => {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      if (!video || !canvas || video.readyState !== video.HAVE_ENOUGH_DATA) {
        animationRef.current = requestAnimationFrame(scanFrame);
        return;
      }

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      if (!ctx) return;

      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const code = jsQR(imageData.data, imageData.width, imageData.height);

      if (code?.data?.startsWith("otpauth://")) {
        onScan(code.data);
        return;
      }

      animationRef.current = requestAnimationFrame(scanFrame);
    };

    startCamera();

    return () => {
      cancelled = true;
      cancelAnimationFrame(animationRef.current);
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, [onScan, onError, t]);

  if (cameraError) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-12 text-muted-foreground">
        <CameraOffIcon className="size-10" />
        <p className="text-sm">{cameraError}</p>
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden rounded-lg">
      {isStarting && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-muted">
          <Loader2Icon className="size-8 animate-spin text-primary" />
        </div>
      )}
      <video
        ref={videoRef}
        className="w-full rounded-lg"
        playsInline
        muted
      />
      <canvas ref={canvasRef} className="hidden" />
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <div className="size-48 rounded-2xl border-2 border-primary/50" />
      </div>
    </div>
  );
}
