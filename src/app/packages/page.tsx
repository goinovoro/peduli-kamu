"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Clock, ShieldCheck, CheckCircle2 } from 'lucide-react';

const mockPackages = [
  {
    id: 'pkg1',
    title: '8 Jam Pendampingan Lansia',
    description: 'Cocok untuk menemani lansia saat keluarga sedang bekerja. Termasuk bantuan makan, mobilitas, dan pengingat obat.',
    tier: 'companion',
    duration: '8 Jam / Hari',
    price: 350000,
    features: ['Pengingat Obat', 'Bantuan Makan', 'Teman Ngobrol']
  },
  {
    id: 'pkg2',
    title: '24 Jam Live-in Companion',
    description: 'Perawat standby 24 jam di rumah untuk pendampingan penuh. (Waktu istirahat disesuaikan).',
    tier: 'companion',
    duration: '24 Jam / Hari',
    price: 800000,
    features: ['Standby 24 Jam', 'Bantuan Mandi & Toileting', 'Laporan Harian']
  },
  {
    id: 'pkg3',
    title: 'Perawatan Luka Post-Operasi',
    description: 'Kunjungan khusus oleh perawat berlisensi (STR Aktif) untuk ganti perban dan perawatan luka steril.',
    tier: 'skilled',
    duration: '1-2 Jam / Kunjungan',
    price: 250000,
    features: ['Perawatan Luka Steril', 'Cek Tanda Vital', 'Edukasi Keluarga']
  }
];

export default function PackagesPage() {
  return (
    <div className="p-4 md:p-8 space-y-8 max-w-7xl mx-auto">
      <div className="text-center max-w-2xl mx-auto space-y-4">
        <h1 className="text-3xl md:text-4xl font-bold text-foreground">Paket Perawatan</h1>
        <p className="text-gray-600 text-lg">Pilih paket layanan home care terstandarisasi yang paling sesuai dengan kebutuhan keluarga Anda.</p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 pt-8">
        {mockPackages.map((pkg) => (
          <Card key={pkg.id} className="flex flex-col hover:border-primary-300 transition-colors shadow-sm">
            <CardHeader>
              <div className="flex justify-between items-start mb-2">
                <span className={`text-xs px-3 py-1 rounded-full font-bold uppercase tracking-wider ${pkg.tier === 'skilled' ? 'bg-primary-100 text-primary-700' : 'bg-teal-100 text-teal-700'}`}>
                  {pkg.tier} Care
                </span>
              </div>
              <CardTitle className="text-2xl leading-tight">{pkg.title}</CardTitle>
              <p className="text-gray-600 text-sm mt-2 line-clamp-3">{pkg.description}</p>
            </CardHeader>
            <CardContent className="flex-1 space-y-6">
              <div className="flex items-center text-gray-700 font-medium">
                <Clock className="w-5 h-5 mr-2 text-primary-500" />
                {pkg.duration}
              </div>
              
              <div className="space-y-3">
                <h4 className="font-semibold text-sm text-gray-900">Termasuk:</h4>
                <ul className="space-y-2">
                  {pkg.features.map((feature, i) => (
                    <li key={i} className="flex items-start text-sm text-gray-600">
                      <CheckCircle2 className="w-4 h-4 mr-2 text-teal-500 shrink-0 mt-0.5" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
            </CardContent>
            <CardFooter className="flex flex-col border-t border-gray-100 pt-6">
              <div className="w-full flex items-end justify-between mb-4">
                <div className="text-sm text-gray-500 font-medium">Mulai dari</div>
                <div className="text-2xl font-bold text-foreground">
                  Rp {pkg.price.toLocaleString('id-ID')}
                </div>
              </div>
              <Button className="w-full text-base font-semibold" size="lg" onClick={() => alert('Fitur pemesanan paket akan segera hadir!')}>
                Pesan Sekarang
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}
