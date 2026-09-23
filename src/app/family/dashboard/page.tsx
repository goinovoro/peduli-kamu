"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { usePeduliStore } from '@/store/usePeduliStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { MapPin, GraduationCap, Clock, CheckCircle, ShieldCheck } from 'lucide-react';
import { MockEscrowProvider } from '@/lib/payments/escrow';

export default function FamilyDashboard() {
  const router = useRouter();
  const { user, patients, caregivers, bookings, addPatient, approveVerificationAndPay } = usePeduliStore();
  
  const [newPatientName, setNewPatientName] = useState('');
  const [newPatientAge, setNewPatientAge] = useState('');
  const [newPatientTier, setNewPatientTier] = useState<'companion' | 'skilled'>('companion');
  const [isApproving, setIsApproving] = useState<string | null>(null);

  const handleApprove = async (bookingId: string, caregiverId: string, amount: number) => {
    setIsApproving(bookingId);
    try {
      const escrow = new MockEscrowProvider();
      await escrow.releaseFunds(bookingId); // Simulate escrow release
      approveVerificationAndPay(bookingId, caregiverId, amount);
      alert('Validasi berhasil! Dana telah diteruskan ke perawat.');
    } catch (e) {
      alert('Terjadi kesalahan sistem.');
    } finally {
      setIsApproving(null);
    }
  };

  useEffect(() => {
    if (!user) {
      router.push('/auth');
    } else if (user.role !== 'family') {
      router.push('/caregiver/dashboard');
    }
  }, [user, router]);

  if (!user || user.role !== 'family') return null;

  const handleAddPatient = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPatientName && newPatientAge) {
      addPatient({
        id: Math.random().toString(36).substr(2, 9),
        name: newPatientName,
        age: parseInt(newPatientAge, 10),
        tier: newPatientTier
      });
      setNewPatientName('');
      setNewPatientAge('');
    }
  };

  const getCaregiver = (id: string) => caregivers.find(c => c.id === id);

  return (
    <div className="p-4 md:p-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Dashboard Keluarga</h1>
        <p className="text-gray-600 mt-2">Kelola profil pasien, temukan perawat, dan pantau kunjungan.</p>
      </div>

      <div className="grid md:grid-cols-3 gap-8">
        <div className="md:col-span-1 space-y-8">
          {/* Patient Roster */}
          <Card>
            <CardHeader>
              <CardTitle>Anggota Keluarga (Pasien)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {patients.length > 0 ? (
                  patients.map((patient) => (
                    <div key={patient.id} className="p-4 bg-primary-50 rounded-xl border border-primary-100 flex justify-between items-center">
                      <div>
                        <div className="font-semibold text-foreground">{patient.name} ({patient.age} th)</div>
                        <div className="text-sm text-primary-700 capitalize mt-1">Tier: {patient.tier}</div>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-gray-500">Belum ada data pasien.</p>
                )}
                
                <div className="pt-4 border-t border-gray-100 mt-4">
                  <h4 className="font-medium text-sm mb-3">Tambah Pasien</h4>
                  <form onSubmit={handleAddPatient} className="space-y-3">
                    <Input placeholder="Nama Pasien" value={newPatientName} onChange={(e) => setNewPatientName(e.target.value)} required />
                    <Input placeholder="Umur" type="number" value={newPatientAge} onChange={(e) => setNewPatientAge(e.target.value)} required />
                    <select 
                      className="flex h-11 w-full rounded-xl border border-gray-200 bg-transparent px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
                      value={newPatientTier}
                      onChange={(e) => setNewPatientTier(e.target.value as 'companion' | 'skilled')}
                    >
                      <option value="companion">Tier 1: Companion Care</option>
                      <option value="skilled">Tier 2: Skilled Medical Care</option>
                    </select>
                    <Button type="submit" size="sm" className="w-full">Simpan</Button>
                  </form>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Active Bookings */}
          <Card>
            <CardHeader>
              <CardTitle>Jadwal Kunjungan</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {bookings.length > 0 ? (
                  bookings.map((booking) => {
                    const caregiver = getCaregiver(booking.caregiverId);
                    return (
                      <div key={booking.id} className="p-4 border border-gray-100 rounded-xl flex flex-col space-y-3">
                        <div className="flex justify-between items-start">
                          <span className="font-medium text-sm">{caregiver?.name}</span>
                          <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                            booking.status === 'awaiting_approval' ? 'bg-blue-100 text-blue-700' :
                            booking.status === 'upcoming' ? 'bg-green-100 text-green-700' : 
                            booking.status === 'pending' ? 'bg-orange-100 text-orange-700' : 'bg-gray-100 text-gray-700'
                          }`}>
                            {booking.status === 'awaiting_approval' ? 'Butuh Validasi' :
                             booking.status === 'upcoming' ? 'Akan Datang' : 
                             booking.status === 'pending' ? 'Menunggu Konfirmasi' : 'Selesai'}
                          </span>
                        </div>
                        <div className="text-xs text-gray-500 flex items-center">
                          <Clock className="w-3 h-3 mr-1" />
                          {new Date(booking.date).toLocaleString('id-ID')}
                        </div>

                        {booking.status === 'awaiting_approval' && booking.verificationData && (
                          <div className="mt-3 p-3 bg-blue-50/50 rounded-lg border border-blue-100 space-y-3">
                            <div className="flex items-start space-x-2">
                              <ShieldCheck className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" />
                              <div className="text-sm text-blue-900">Perawat telah menyelesaikan kunjungan dan mengirimkan bukti absensi.</div>
                            </div>
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={booking.verificationData.photoUrl} alt="Bukti Kunjungan" className="w-full h-32 object-cover rounded-md" />
                            <div className="flex items-center text-xs text-gray-600">
                              <MapPin className="w-3 h-3 mr-1" /> {booking.verificationData.location}
                            </div>
                            <Button 
                              size="sm" 
                              className="w-full bg-blue-600 hover:bg-blue-700" 
                              onClick={() => handleApprove(booking.id, booking.caregiverId, booking.price)}
                              disabled={isApproving === booking.id}
                            >
                              {isApproving === booking.id ? 'Memproses Escrow...' : 'Validasi & Cairkan Dana'}
                            </Button>
                          </div>
                        )}
                      </div>
                    );
                  })
                ) : (
                  <p className="text-sm text-gray-500">Tidak ada jadwal kunjungan.</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Caregiver Discovery & Custom Jobs */}
        <div className="md:col-span-2 space-y-8">
          <Card className="bg-primary-50 border-primary-100">
            <CardContent className="p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <h3 className="font-bold text-lg text-primary-900">Butuh Perawatan Spesifik?</h3>
                <p className="text-sm text-primary-700">Posting permintaan khusus Anda dan biarkan perawat yang mengajukan penawaran.</p>
              </div>
              <Button onClick={() => router.push('/jobs/new')} className="shrink-0">
                Buat Permintaan Khusus
              </Button>
            </CardContent>
          </Card>

          <Card className="h-full bg-gray-50/50 border-none shadow-none">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Temukan Perawat Tersedia</CardTitle>
              <Button variant="ghost" size="sm" onClick={() => router.push('/family/find')} className="text-primary-600 hover:text-primary-700">
                Lihat Semua &rarr;
              </Button>
            </CardHeader>
            <CardContent>
              <div className="grid sm:grid-cols-2 gap-4">
                {caregivers.map((caregiver) => (
                  <Card key={caregiver.id} className="hover:border-primary-200 transition-colors">
                    <CardContent className="p-5">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className="font-bold text-lg">{caregiver.name}</h3>
                          <div className="text-sm text-gray-500 capitalize">{caregiver.tier} Care</div>
                        </div>
                        <div className={`text-xs px-2 py-1 rounded-full font-medium ${caregiver.strStatus === 'STR Aktif' ? 'bg-primary-100 text-primary-700' : 'bg-teal-100 text-teal-700'}`}>
                          {caregiver.strStatus}
                        </div>
                      </div>
                      
                      <div className="space-y-2 mb-6">
                        <div className="flex items-center text-sm text-gray-600">
                          <GraduationCap className="w-4 h-4 mr-2 text-gray-400" />
                          {caregiver.university} ('{caregiver.graduationYear.toString().slice(2)})
                        </div>
                        <div className="flex items-center text-sm text-gray-600">
                          <MapPin className="w-4 h-4 mr-2 text-gray-400" />
                          {caregiver.location}
                        </div>
                      </div>

                      <div className="flex items-center justify-between mt-auto">
                        <div className="font-semibold text-foreground">
                          Rp {caregiver.ratePerHour.toLocaleString('id-ID')} <span className="text-xs text-gray-500 font-normal">/ jam</span>
                        </div>
                        <Button size="sm">Booking</Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
