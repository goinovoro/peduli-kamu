"use client";

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { usePeduliStore } from '@/store/usePeduliStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { User, CheckCircle, XCircle, Clock, MapPin, Wallet, Info, Trophy, Star, ShieldCheck, Gift } from 'lucide-react';
import { ShiftVerification } from '@/components/ui/ShiftVerification';

export default function CaregiverDashboard() {
  const router = useRouter();
  const { user, bookings, patients, acceptBooking, declineBooking } = usePeduliStore();

  useEffect(() => {
    if (!user) {
      router.push('/auth');
    } else if (user.role !== 'caregiver') {
      router.push('/family/dashboard');
    }
  }, [user, router]);

  if (!user || user.role !== 'caregiver') return null;

  // Mock matching caregiver profile for this session
  // Usually this would come from a backend query matching user.id
  const myProfile = usePeduliStore.getState().caregivers[0]; 
  const myBookings = bookings.filter(b => b.caregiverId === myProfile.id);

  const getPatient = (id: string) => patients.find(p => p.id === id);

  return (
    <div className="p-4 md:p-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Dashboard Mitra Perawat</h1>
        <p className="text-gray-600 mt-2">Kelola profil, jadwal, dan terima permintaan kunjungan.</p>
      </div>

      <div className="grid md:grid-cols-3 gap-8">
        {/* Profile and Settings */}
        <div className="md:col-span-1 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Profil & Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center text-primary-600">
                  <User className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="font-bold text-lg">{myProfile.name}</h3>
                  <p className="text-sm text-gray-500">{myProfile.university}</p>
                </div>
              </div>
              
              <div className="pt-4 border-t border-gray-100 space-y-3">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-600">Tier Layanan</span>
                  <span className="font-semibold capitalize">{myProfile.tier} Care</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-600">Status STR/SIP</span>
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${myProfile.strStatus === 'STR Aktif' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                    {myProfile.strStatus}
                  </span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-600">Tarif / Jam</span>
                  <span className="font-semibold">Rp {myProfile.ratePerHour.toLocaleString('id-ID')}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Ketersediaan</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat'].map((day) => (
                  <div key={day} className="flex items-center justify-between">
                    <span className="text-sm font-medium">{day}</span>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" defaultChecked />
                      <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary-500"></div>
                    </label>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="border-yellow-200 shadow-sm bg-gradient-to-b from-yellow-50 to-white">
            <CardHeader className="pb-3 border-b border-yellow-100">
              <CardTitle className="flex items-center text-yellow-800">
                <Trophy className="w-5 h-5 mr-2 text-yellow-600" />
                Peduli Kamu Rewards
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="font-bold text-gray-900 text-sm">
                    {myProfile.level === 1 ? 'Level 1: Mitra Baru' :
                     myProfile.level === 2 ? 'Level 2: Terpercaya' : 'Level 3: Ahli'}
                  </span>
                  <span className="text-xs font-semibold text-yellow-600 bg-yellow-100 px-2 py-0.5 rounded-full">
                    {myProfile.level === 3 ? 'MAX' : `Level ${myProfile.level}`}
                  </span>
                </div>
                
                {myProfile.level < 3 && (
                  <>
                    <div className="w-full bg-gray-200 rounded-full h-2.5 mt-2">
                      <div className="bg-yellow-400 h-2.5 rounded-full" 
                        style={{ width: `${Math.min((myProfile.completedClients / (myProfile.level === 1 ? 5 : 20)) * 100, 100)}%` }}></div>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                      Selesaikan <span className="font-bold">{ (myProfile.level === 1 ? 5 : 20) - myProfile.completedClients }</span> kunjungan lagi untuk naik ke Level {myProfile.level + 1}.
                    </p>
                  </>
                )}
              </div>

              <div className="bg-white p-3 rounded-lg border border-yellow-100 shadow-sm">
                <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Perks Aktif Anda</h4>
                <ul className="space-y-2">
                  <li className="flex items-start text-sm">
                    <CheckCircle className="w-4 h-4 text-green-500 mr-2 shrink-0 mt-0.5" />
                    <span>Akses ke Bursa Permintaan</span>
                  </li>
                  {myProfile.level >= 2 && (
                    <li className="flex items-start text-sm">
                      <Star className="w-4 h-4 text-yellow-500 mr-2 shrink-0 mt-0.5" />
                      <span className="font-medium text-yellow-800">Bonus Fee 5% tiap shift</span>
                    </li>
                  )}
                  {myProfile.level >= 3 && (
                    <li className="flex items-start text-sm">
                      <ShieldCheck className="w-4 h-4 text-blue-500 mr-2 shrink-0 mt-0.5" />
                      <span className="font-medium text-blue-800">Merchandise Eksklusif Lencana</span>
                    </li>
                  )}
                </ul>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Dompet Digital</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center text-green-600">
                  <Wallet className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-sm text-gray-500 font-medium">Saldo Tersedia</div>
                  <div className="text-xl font-bold">Rp {myProfile.walletBalance.toLocaleString('id-ID')}</div>
                </div>
              </div>

              <div className="space-y-3 pt-2">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-600">Total Pasien Dilayani</span>
                  <span className="font-semibold">{myProfile.completedClients} / 3</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-primary-500 h-2 rounded-full" style={{ width: `${Math.min((myProfile.completedClients / 3) * 100, 100)}%` }}></div>
                </div>
                
                {myProfile.completedClients < 3 ? (
                  <div className="flex items-start p-3 bg-blue-50 text-blue-800 rounded-lg text-xs">
                    <Info className="w-4 h-4 mr-2 shrink-0 mt-0.5" />
                    <span>Fitur tarik dana dikunci. Anda harus menyelesaikan minimal 3 kunjungan pertama sebagai jaminan kualitas layanan (Retention Policy).</span>
                  </div>
                ) : null}

                <Button 
                  className="w-full mt-4" 
                  disabled={myProfile.completedClients < 3 || myProfile.walletBalance === 0}
                  onClick={() => alert('Dana berhasil ditarik ke rekening bank Anda!')}
                >
                  Tarik Dana
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Shift Management */}
        <div className="md:col-span-2 space-y-6">
          {/* Active Shift / Verification */}
          {myBookings.some(b => b.status === 'upcoming') && (
            <Card className="border-primary-200 shadow-md">
              <CardHeader className="bg-primary-50 rounded-t-xl border-b border-primary-100">
                <CardTitle className="text-primary-800">Selesaikan Kunjungan Aktif</CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <p className="text-gray-600 mb-6 text-center">Silakan ambil selfie bersama pasien di lokasi untuk memvalidasi kunjungan Anda. Sistem akan mencatat lokasi GPS Anda secara otomatis.</p>
                {myBookings.filter(b => b.status === 'upcoming').map(booking => (
                  <ShiftVerification key={booking.id} bookingId={booking.id} />
                ))}
              </CardContent>
            </Card>
          )}

          <Card className="h-full">
            <CardHeader>
              <CardTitle>Permintaan & Jadwal Masuk</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {myBookings.length > 0 ? (
                  myBookings.map((booking) => {
                    const patient = getPatient(booking.patientId);
                    return (
                      <div key={booking.id} className="p-5 border border-gray-100 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="space-y-2">
                          <div className="flex items-center space-x-2">
                            <span className="font-bold text-lg">{patient?.name} ({patient?.age} th)</span>
                            <span className={`text-xs px-2 py-1 rounded-full font-medium ${booking.status === 'pending' ? 'bg-orange-100 text-orange-700' : 'bg-green-100 text-green-700'}`}>
                              {booking.status === 'pending' ? 'Menunggu Anda' : 'Dikonfirmasi'}
                            </span>
                          </div>
                          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-sm text-gray-600">
                            <div className="flex items-center">
                              <Clock className="w-4 h-4 mr-1.5" />
                              {new Date(booking.date).toLocaleString('id-ID')}
                            </div>
                            <div className="flex items-center">
                              <MapPin className="w-4 h-4 mr-1.5" />
                              Jakarta Selatan
                            </div>
                          </div>
                        </div>
                        
                        {booking.status === 'pending' ? (
                          <div className="flex space-x-2">
                            <Button size="sm" onClick={() => acceptBooking(booking.id)} className="flex-1 sm:flex-none">
                              <CheckCircle className="w-4 h-4 mr-1" /> Terima
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => declineBooking(booking.id)} className="flex-1 sm:flex-none text-red-600 border-red-200 hover:bg-red-50">
                              <XCircle className="w-4 h-4 mr-1" /> Tolak
                            </Button>
                          </div>
                        ) : (
                          <Button variant="secondary" size="sm" disabled>
                            Jadwal Diterima
                          </Button>
                        )}
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center py-10 text-gray-500">
                    <p>Belum ada permintaan masuk.</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
