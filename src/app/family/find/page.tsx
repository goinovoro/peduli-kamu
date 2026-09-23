"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { usePeduliStore } from '@/store/usePeduliStore';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { MapPin, GraduationCap, Search, Filter, SlidersHorizontal } from 'lucide-react';

export default function FindCaregiverPage() {
  const router = useRouter();
  const { user, caregivers } = usePeduliStore();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [tierFilter, setTierFilter] = useState<'all' | 'companion' | 'skilled'>('all');
  const [strFilter, setStrFilter] = useState<'all' | 'STR Aktif' | 'Menunggu STR'>('all');

  useEffect(() => {
    if (!user || user.role !== 'family') {
      router.push('/auth');
    }
  }, [user, router]);

  if (!user || user.role !== 'family') return null;

  // Filter caregivers
  const filteredCaregivers = caregivers.filter((c) => {
    const matchesSearch = c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          c.location.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTier = tierFilter === 'all' || c.tier === tierFilter;
    const matchesStr = strFilter === 'all' || c.strStatus === strFilter;
    
    return matchesSearch && matchesTier && matchesStr;
  });

  return (
    <div className="p-4 md:p-8 space-y-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Temukan Perawat</h1>
          <p className="text-gray-600 mt-2">Cari dan pilih perawat yang sesuai dengan kebutuhan keluarga Anda.</p>
        </div>
      </div>

      <div className="grid md:grid-cols-4 gap-6">
        {/* Filters Sidebar */}
        <div className="md:col-span-1 space-y-6">
          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm space-y-6">
            <div className="flex items-center space-x-2 font-semibold text-lg border-b border-gray-100 pb-3">
              <SlidersHorizontal className="w-5 h-5" />
              <span>Filter Pencarian</span>
            </div>
            
            <div className="space-y-3">
              <label className="text-sm font-medium text-gray-700">Cari Nama atau Lokasi</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input 
                  type="text"
                  placeholder="Contoh: Jakarta..."
                  className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-sm font-medium text-gray-700">Tingkat Layanan (Tier)</label>
              <select 
                className="w-full p-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                value={tierFilter}
                onChange={(e) => setTierFilter(e.target.value as any)}
              >
                <option value="all">Semua Layanan</option>
                <option value="companion">Tier 1: Companion Care</option>
                <option value="skilled">Tier 2: Skilled Medical Care</option>
              </select>
            </div>

            <div className="space-y-3">
              <label className="text-sm font-medium text-gray-700">Status STR</label>
              <select 
                className="w-full p-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                value={strFilter}
                onChange={(e) => setStrFilter(e.target.value as any)}
              >
                <option value="all">Semua Status</option>
                <option value="STR Aktif">STR Aktif</option>
                <option value="Menunggu STR">Menunggu STR</option>
              </select>
            </div>
          </div>
        </div>

        {/* Caregiver List */}
        <div className="md:col-span-3">
          <div className="mb-4 text-sm text-gray-500 font-medium">
            Menampilkan {filteredCaregivers.length} perawat tersedia
          </div>
          
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredCaregivers.length > 0 ? (
              filteredCaregivers.map((caregiver) => (
                <Card key={caregiver.id} className="hover:border-primary-300 transition-colors shadow-sm hover:shadow-md flex flex-col">
                  <CardContent className="p-5 flex flex-col flex-1">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="font-bold text-lg leading-tight">{caregiver.name}</h3>
                        <div className="text-sm text-primary-600 capitalize font-medium mt-1">{caregiver.tier} Care</div>
                      </div>
                      <div className={`text-[10px] px-2 py-1 rounded-full font-bold uppercase tracking-wider ${caregiver.strStatus === 'STR Aktif' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                        {caregiver.strStatus}
                      </div>
                    </div>
                    
                    <div className="space-y-3 mb-6 flex-1">
                      <div className="flex items-start text-sm text-gray-600">
                        <GraduationCap className="w-4 h-4 mr-2 mt-0.5 text-gray-400 shrink-0" />
                        <span className="leading-tight">{caregiver.university} ('{caregiver.graduationYear.toString().slice(2)})</span>
                      </div>
                      <div className="flex items-center text-sm text-gray-600">
                        <MapPin className="w-4 h-4 mr-2 text-gray-400 shrink-0" />
                        {caregiver.location}
                      </div>
                    </div>

                    <div className="pt-4 border-t border-gray-100 mt-auto">
                      <div className="flex items-center justify-between">
                        <div className="font-bold text-foreground text-lg">
                          Rp {caregiver.ratePerHour.toLocaleString('id-ID')}
                          <span className="text-xs text-gray-500 font-normal ml-1">/ jam</span>
                        </div>
                        <Button size="sm" onClick={() => router.push(`/mitra/${caregiver.id}`)}>Lihat Profil</Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="col-span-full py-12 text-center bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                <Search className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <h3 className="text-lg font-medium text-gray-900">Perawat tidak ditemukan</h3>
                <p className="text-gray-500 mt-1">Coba ubah filter pencarian Anda.</p>
                <Button variant="outline" className="mt-4" onClick={() => {
                  setSearchTerm(''); setTierFilter('all'); setStrFilter('all');
                }}>Reset Filter</Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
