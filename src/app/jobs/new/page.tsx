"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { usePeduliStore } from '@/store/usePeduliStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

export default function NewJobPage() {
  const router = useRouter();
  const { user, addJob } = usePeduliStore();

  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    title: '',
    location: '',
    description: '',
    budget: '',
  });

  useEffect(() => {
    if (!user || user.role !== 'family') {
      router.push('/auth');
    }
  }, [user, router]);

  if (!user || user.role !== 'family') return null;

  const handleNext = () => setStep(step + 1);
  const handlePrev = () => setStep(step - 1);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addJob({
      id: Math.random().toString(36).substr(2, 9),
      familyId: user.id,
      title: formData.title,
      description: formData.description,
      location: formData.location,
      budget: parseInt(formData.budget, 10),
      status: 'open',
      createdAt: new Date().toISOString()
    });
    alert('Permintaan Anda berhasil diposting!');
    router.push('/family/dashboard');
  };

  return (
    <div className="p-4 md:p-8 max-w-3xl mx-auto w-full">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground">Buat Permintaan Khusus</h1>
        <p className="text-gray-600 mt-2">Jelaskan kebutuhan asuhan Anda agar perawat yang tepat dapat mengirimkan penawaran.</p>
      </div>

      <div className="mb-8 flex items-center justify-between relative">
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-gray-100 -z-10"></div>
        <div className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-primary-500 -z-10 transition-all duration-300" style={{ width: step === 1 ? '0%' : step === 2 ? '50%' : '100%' }}></div>
        
        {[1, 2, 3].map((num) => (
          <div key={num} className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm transition-colors ${step >= num ? 'bg-primary-500 text-white' : 'bg-gray-200 text-gray-500'}`}>
            {num}
          </div>
        ))}
      </div>

      <Card>
        <CardContent className="pt-6">
          <form onSubmit={step === 3 ? handleSubmit : (e) => { e.preventDefault(); handleNext(); }}>
            {step === 1 && (
              <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                <h2 className="text-xl font-bold mb-4">Informasi Dasar</h2>
                <Input 
                  label="Judul Permintaan" 
                  placeholder="Contoh: Perawatan Luka Diabetes (Harian)"
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                  required 
                />
                <Input 
                  label="Lokasi" 
                  placeholder="Contoh: Jakarta Selatan"
                  value={formData.location}
                  onChange={(e) => setFormData({...formData, location: e.target.value})}
                  required 
                />
              </div>
            )}

            {step === 2 && (
              <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                <h2 className="text-xl font-bold mb-4">Detail Kebutuhan</h2>
                <div className="flex flex-col space-y-2 w-full">
                  <label className="text-sm font-medium leading-none text-foreground">Deskripsi Tugas</label>
                  <textarea 
                    className="flex min-h-[120px] w-full rounded-xl border border-gray-200 bg-transparent px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
                    placeholder="Jelaskan kondisi pasien dan tugas yang diharapkan..."
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    required
                  ></textarea>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                <h2 className="text-xl font-bold mb-4">Anggaran & Konfirmasi</h2>
                <Input 
                  label="Anggaran (Rp)" 
                  type="number"
                  placeholder="Contoh: 150000"
                  value={formData.budget}
                  onChange={(e) => setFormData({...formData, budget: e.target.value})}
                  required 
                />
                <div className="p-4 bg-primary-50 rounded-xl border border-primary-100 mt-6 space-y-2">
                  <h3 className="font-semibold">{formData.title}</h3>
                  <p className="text-sm text-gray-600">{formData.description}</p>
                  <div className="text-sm font-medium pt-2 text-primary-700">Lokasi: {formData.location}</div>
                </div>
              </div>
            )}

            <div className="flex justify-between mt-8 pt-4 border-t border-gray-100">
              <Button type="button" variant="outline" onClick={handlePrev} disabled={step === 1}>
                Kembali
              </Button>
              <Button type="submit">
                {step === 3 ? 'Posting Permintaan' : 'Selanjutnya'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
