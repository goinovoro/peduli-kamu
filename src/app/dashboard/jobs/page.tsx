"use client";

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { usePeduliStore } from '@/store/usePeduliStore';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { MapPin, Clock, Briefcase } from 'lucide-react';

export default function CaregiverJobFeed() {
  const router = useRouter();
  const { user, jobs } = usePeduliStore();

  useEffect(() => {
    if (!user || user.role !== 'caregiver') {
      router.push('/auth');
    }
  }, [user, router]);

  if (!user || user.role !== 'caregiver') return null;

  const openJobs = jobs.filter(j => j.status === 'open');

  return (
    <div className="p-4 md:p-8 space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Bursa Permintaan</h1>
        <p className="text-gray-600 mt-2">Telusuri permintaan asuhan khusus dari keluarga dan ajukan penawaran Anda.</p>
      </div>

      <div className="space-y-4 pt-4">
        {openJobs.length > 0 ? (
          openJobs.map((job) => (
            <Card key={job.id} className="hover:border-primary-300 transition-all shadow-sm group">
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                  <div className="space-y-3 flex-1">
                    <div>
                      <h2 className="text-xl font-bold text-foreground group-hover:text-primary-600 transition-colors">{job.title}</h2>
                      <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-gray-500">
                        <div className="flex items-center">
                          <MapPin className="w-4 h-4 mr-1" />
                          {job.location}
                        </div>
                        <div className="flex items-center">
                          <Clock className="w-4 h-4 mr-1" />
                          Diposting {new Date(job.createdAt).toLocaleDateString('id-ID')}
                        </div>
                      </div>
                    </div>
                    
                    <p className="text-gray-600 text-sm leading-relaxed">
                      {job.description}
                    </p>
                  </div>
                  
                  <div className="md:text-right shrink-0 flex flex-col md:items-end justify-between min-h-full">
                    <div className="mb-4 md:mb-0">
                      <div className="text-xs text-gray-500 font-medium mb-1">Anggaran Keluarga</div>
                      <div className="text-xl font-bold text-foreground">
                        Rp {job.budget.toLocaleString('id-ID')}
                      </div>
                    </div>
                    
                    <Button onClick={() => alert(`Fitur kirim penawaran untuk ${job.title} akan segera hadir!`)} className="w-full md:w-auto mt-4 md:mt-0">
                      <Briefcase className="w-4 h-4 mr-2" />
                      Kirim Penawaran
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="text-center py-12 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
            <Briefcase className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <h3 className="text-lg font-medium text-gray-900">Belum ada permintaan</h3>
            <p className="text-gray-500">Saat ini tidak ada permintaan khusus yang terbuka.</p>
          </div>
        )}
      </div>
    </div>
  );
}
