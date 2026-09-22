import React from 'react';
import Link from 'next/link';
import { ShieldCheck, HeartHandshake, UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export default function Home() {
  return (
    <div className="flex-1 flex flex-col w-full">
      {/* Hero Section */}
      <section className="px-4 py-16 md:py-24 bg-primary-50 rounded-b-[3rem] w-full flex-1 flex flex-col items-center text-center">
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground max-w-3xl leading-tight tracking-tight">
          Perawatan di Rumah yang <span className="text-primary-600">Terpercaya</span> dari Hati
        </h1>
        <p className="mt-6 text-lg md:text-xl text-gray-600 max-w-2xl">
          Menghubungkan keluarga dengan lulusan perawat bersertifikat untuk memberikan asuhan terbaik di rumah Anda.
        </p>
        <div className="mt-10 flex flex-col sm:flex-row gap-4 w-full sm:w-auto px-4 sm:px-0">
          <Link href="/auth?role=family" className="w-full sm:w-auto">
            <Button size="lg" className="w-full text-base font-semibold space-x-2">
              <HeartHandshake className="w-5 h-5" />
              <span>Temukan Perawat</span>
            </Button>
          </Link>
          <Link href="/auth?role=caregiver" className="w-full sm:w-auto">
            <Button variant="outline" size="lg" className="w-full text-base font-semibold space-x-2 bg-white">
              <UserPlus className="w-5 h-5" />
              <span>Gabung Mitra</span>
            </Button>
          </Link>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 px-4 max-w-5xl mx-auto w-full">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold text-foreground">Layanan Kami</h2>
          <p className="mt-4 text-gray-600">Dua tingkatan asuhan sesuai kebutuhan keluarga Anda</p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm flex flex-col">
            <div className="w-14 h-14 bg-teal-100 rounded-2xl flex items-center justify-center mb-6">
              <HeartHandshake className="w-7 h-7 text-teal-600" />
            </div>
            <h3 className="text-2xl font-semibold mb-3">Companion Care (Tier 1)</h3>
            <p className="text-gray-600 mb-6 flex-1">
              Bantuan sehari-hari dan pendampingan untuk lansia atau pasien yang membutuhkan asisten personal. Dilakukan oleh lulusan perawat yang sedang menunggu STR (Surat Tanda Registrasi).
            </p>
            <ul className="space-y-3">
              <li className="flex items-center text-sm text-gray-700">
                <ShieldCheck className="w-5 h-5 text-teal-500 mr-3" /> Pendampingan harian
              </li>
              <li className="flex items-center text-sm text-gray-700">
                <ShieldCheck className="w-5 h-5 text-teal-500 mr-3" /> Membantu mobilitas
              </li>
              <li className="flex items-center text-sm text-gray-700">
                <ShieldCheck className="w-5 h-5 text-teal-500 mr-3" /> Mengingatkan jadwal obat
              </li>
            </ul>
          </div>

          <div className="bg-white p-8 rounded-3xl border border-primary-100 shadow-sm flex flex-col ring-1 ring-primary-100 relative">
            <div className="absolute top-0 right-0 bg-primary-100 text-primary-700 text-xs font-bold px-3 py-1 rounded-bl-xl rounded-tr-3xl">Paling Banyak Dicari</div>
            <div className="w-14 h-14 bg-primary-100 rounded-2xl flex items-center justify-center mb-6">
              <ShieldCheck className="w-7 h-7 text-primary-600" />
            </div>
            <h3 className="text-2xl font-semibold mb-3">Skilled Medical Care (Tier 2)</h3>
            <p className="text-gray-600 mb-6 flex-1">
              Perawatan medis profesional di rumah untuk pasien dalam masa pemulihan atau kondisi khusus. Dilakukan oleh perawat berlisensi dengan STR Aktif.
            </p>
            <ul className="space-y-3">
              <li className="flex items-center text-sm text-gray-700">
                <ShieldCheck className="w-5 h-5 text-primary-500 mr-3" /> Perawatan luka medis
              </li>
              <li className="flex items-center text-sm text-gray-700">
                <ShieldCheck className="w-5 h-5 text-primary-500 mr-3" /> Pemasangan alat bantu kesehatan
              </li>
              <li className="flex items-center text-sm text-gray-700">
                <ShieldCheck className="w-5 h-5 text-primary-500 mr-3" /> Pemantauan tanda vital intensif
              </li>
            </ul>
          </div>
        </div>
      </section>
    </div>
  );
}
