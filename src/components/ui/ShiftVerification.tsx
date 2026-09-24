"use client";

import React, { useRef, useState, useCallback } from 'react';
import Webcam from 'react-webcam';
import { Button } from './Button';
import { Camera, MapPin, Loader2, CheckCircle2 } from 'lucide-react';
import { usePeduliStore } from '@/store/usePeduliStore';

interface ShiftVerificationProps {
  bookingId: string;
  onVerified?: () => void;
}

export function ShiftVerification({ bookingId, onVerified }: ShiftVerificationProps) {
  const webcamRef = useRef<Webcam>(null);
  const [imgSrc, setImgSrc] = useState<string | null>(null);
  const [location, setLocation] = useState<string>('');
  const [isLocating, setIsLocating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { submitVerification } = usePeduliStore();

  const capture = useCallback(() => {
    const imageSrc = webcamRef.current?.getScreenshot();
    if (imageSrc) {
      setImgSrc(imageSrc);
      
      // Geolocation is deactivated for now
      setLocation('Lokasi tidak tersedia (fitur dinonaktifkan)');
      setIsLocating(false);
    }
  }, [webcamRef]);

  const retake = () => {
    setImgSrc(null);
    setLocation('');
  };

  const submit = async () => {
    if (!imgSrc || !location) return;
    setIsSubmitting(true);
    
    // Simulate network delay
    setTimeout(() => {
      submitVerification(bookingId, imgSrc, location);
      setIsSubmitting(false);
      if (onVerified) onVerified();
    }, 1500);
  };

  if (isSubmitting) {
    return (
      <div className="flex flex-col items-center justify-center p-8 space-y-4">
        <Loader2 className="w-10 h-10 text-primary-500 animate-spin" />
        <p className="text-gray-600 font-medium">Mengirim data absensi...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 w-full max-w-sm mx-auto">
      <div className="bg-gray-100 rounded-2xl overflow-hidden aspect-[4/3] relative border border-gray-200">
        {!imgSrc ? (
          <Webcam
            audio={false}
            ref={webcamRef}
            screenshotFormat="image/jpeg"
            className="w-full h-full object-cover"
            videoConstraints={{ facingMode: "user" }}
          />
        ) : (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={imgSrc} alt="Absensi selfie" className="w-full h-full object-cover" />
            <div className="absolute bottom-0 left-0 w-full bg-black/60 text-white p-3 backdrop-blur-sm flex items-center space-x-2">
              <MapPin className="w-4 h-4 shrink-0 text-primary-400" />
              <span className="text-xs truncate">
                {isLocating ? 'Mengambil lokasi...' : location}
              </span>
            </div>
          </>
        )}
      </div>

      {!imgSrc ? (
        <Button onClick={capture} className="w-full" size="lg">
          <Camera className="w-5 h-5 mr-2" />
          Ambil Foto Absensi
        </Button>
      ) : (
        <div className="flex space-x-3">
          <Button variant="outline" onClick={retake} className="flex-1" disabled={isLocating}>
            Ulangi
          </Button>
          <Button onClick={submit} className="flex-1 bg-green-600 hover:bg-green-700 active:bg-green-800" disabled={isLocating}>
            <CheckCircle2 className="w-5 h-5 mr-2" />
            Kirim
          </Button>
        </div>
      )}
    </div>
  );
}
