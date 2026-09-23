"use client";

import React, { use } from 'react';
import { notFound } from 'next/navigation';
import { usePeduliStore } from '@/store/usePeduliStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { User, Star, MapPin, GraduationCap, ShieldCheck, Cross, Crosshair, HeartPulse, Clock, FileBadge2 } from 'lucide-react';

interface MitraPageProps {
  params: Promise<{ id: string }>;
}

export default function MitraPage({ params }: MitraPageProps) {
  const resolvedParams = use(params);
  const caregiverId = resolvedParams.id;
  const { caregivers } = usePeduliStore();
  
  const caregiver = caregivers.find(c => c.id === caregiverId);
  if (!caregiver) {
    notFound();
  }

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto space-y-8">
      {/* Header Profile Section */}
      <Card className="border-primary-100 shadow-sm overflow-hidden">
        <div className="h-32 bg-gradient-to-r from-primary-500 to-teal-400"></div>
        <CardContent className="px-6 pt-0 pb-6 -mt-16 relative">
          <div className="flex flex-col sm:flex-row gap-6 items-start sm:items-end">
            <div className="w-32 h-32 rounded-full bg-white border-4 border-white flex items-center justify-center text-primary-600 shadow-md">
              <User className="w-16 h-16" />
            </div>
            
            <div className="flex-1 space-y-2 mb-2">
              <div className="flex items-center space-x-2">
                <h1 className="text-3xl font-bold text-foreground">{caregiver.name}</h1>
                {caregiver.isVerified && (
                  <div title="Identitas Terverifikasi" className="bg-blue-100 text-blue-600 p-1 rounded-full">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                )}
                {caregiver.strStatus === 'STR Aktif' && (
                  <div title="STR Aktif" className="bg-green-100 text-green-600 p-1 rounded-full">
                    <HeartPulse className="w-5 h-5" />
                  </div>
                )}
              </div>
              
              <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                <div className="flex items-center">
                  <GraduationCap className="w-4 h-4 mr-1.5" />
                  {caregiver.university} ({caregiver.graduationYear})
                </div>
                <div className="flex items-center">
                  <MapPin className="w-4 h-4 mr-1.5" />
                  {caregiver.location}
                </div>
                <div className="flex items-center">
                  <FileBadge2 className="w-4 h-4 mr-1.5" />
                  <span className="capitalize">{caregiver.tier} Care</span>
                </div>
              </div>
            </div>

            <div className="w-full sm:w-auto shrink-0 space-y-3 mb-2">
              <div className="text-xl font-bold text-primary-700 sm:text-right">
                Rp {caregiver.ratePerHour.toLocaleString('id-ID')} <span className="text-sm font-normal text-gray-500">/ jam</span>
              </div>
              <Button size="lg" className="w-full shadow-lg" onClick={() => alert('Fitur booking langsung akan segera hadir!')}>
                Pesan Sekarang
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="text-center py-4 border-none shadow-sm bg-gray-50/50">
          <div className="text-gray-500 text-sm font-medium mb-1">Total Pasien</div>
          <div className="text-2xl font-bold text-foreground">{caregiver.completedClients}</div>
        </Card>
        <Card className="text-center py-4 border-none shadow-sm bg-gray-50/50">
          <div className="text-gray-500 text-sm font-medium mb-1">Rating</div>
          <div className="text-2xl font-bold text-foreground flex items-center justify-center">
            {caregiver.rating > 0 ? caregiver.rating : '-'} 
            <Star className="w-5 h-5 text-yellow-400 ml-1 fill-yellow-400" />
          </div>
        </Card>
        <Card className="text-center py-4 border-none shadow-sm bg-gray-50/50">
          <div className="text-gray-500 text-sm font-medium mb-1">Ulasan</div>
          <div className="text-2xl font-bold text-foreground">{caregiver.reviews.length}</div>
        </Card>
        <Card className="text-center py-4 border-none shadow-sm bg-gray-50/50">
          <div className="text-gray-500 text-sm font-medium mb-1">Spesialisasi</div>
          <div className="text-2xl font-bold text-foreground">{caregiver.specializations.length}</div>
        </Card>
      </div>

      <div className="grid md:grid-cols-3 gap-8">
        <div className="md:col-span-1 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Spesialisasi</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {caregiver.specializations.length > 0 ? (
                  caregiver.specializations.map((spec, i) => (
                    <span key={i} className="px-3 py-1.5 bg-primary-50 text-primary-700 text-xs font-medium rounded-lg border border-primary-100">
                      {spec}
                    </span>
                  ))
                ) : (
                  <span className="text-sm text-gray-500">Belum ada data.</span>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="md:col-span-2 space-y-6">
          <h2 className="text-xl font-bold text-foreground">Ulasan Keluarga</h2>
          
          <div className="space-y-4">
            {caregiver.reviews.length > 0 ? (
              caregiver.reviews.map((review) => (
                <Card key={review.id} className="border-gray-100 shadow-none">
                  <CardContent className="p-5 space-y-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="font-semibold text-foreground">{review.familyName}</div>
                        <div className="text-xs text-gray-500 mt-0.5">{new Date(review.date).toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' })}</div>
                      </div>
                      <div className="flex items-center bg-yellow-50 px-2 py-1 rounded">
                        <span className="text-sm font-bold text-yellow-700 mr-1">{review.rating}</span>
                        <Star className="w-3.5 h-3.5 text-yellow-500 fill-yellow-500" />
                      </div>
                    </div>
                    <p className="text-sm text-gray-700 leading-relaxed">
                      "{review.comment}"
                    </p>
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="text-center py-12 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                <Star className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <h3 className="text-lg font-medium text-gray-900">Belum ada ulasan</h3>
                <p className="text-gray-500 text-sm">Perawat ini belum memiliki ulasan dari keluarga.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
