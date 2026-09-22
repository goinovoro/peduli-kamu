"use client";

import React, { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { usePeduliStore, Role } from '@/store/usePeduliStore';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';

function AuthForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const defaultRole = (searchParams.get('role') as Role) || 'family';
  
  const [role, setRole] = useState<Role>(defaultRole);
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState('');
  
  const { login } = usePeduliStore();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Simulate authentication
    const user = {
      id: Math.random().toString(36).substr(2, 9),
      name: name || (role === 'family' ? 'Keluarga Budi' : 'Ners Ana'),
      role: role,
      email: 'user@example.com'
    };
    login(user);
    if (role === 'family') {
      router.push('/family/dashboard');
    } else {
      router.push('/caregiver/dashboard');
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="text-2xl text-center">
          {isLogin ? 'Masuk ke Akun Anda' : 'Daftar Akun Baru'}
        </CardTitle>
        <p className="text-center text-gray-500 text-sm mt-2">
          Pilih peran Anda untuk melanjutkan
        </p>
      </CardHeader>
      <CardContent>
        <div className="flex p-1 bg-gray-100 rounded-xl mb-6">
          <button
            type="button"
            className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${role === 'family' ? 'bg-white shadow-sm text-foreground' : 'text-gray-500 hover:text-foreground'}`}
            onClick={() => setRole('family')}
          >
            Keluarga
          </button>
          <button
            type="button"
            className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${role === 'caregiver' ? 'bg-white shadow-sm text-foreground' : 'text-gray-500 hover:text-foreground'}`}
            onClick={() => setRole('caregiver')}
          >
            Perawat
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <Input 
              label="Nama Lengkap" 
              placeholder="Masukkan nama Anda" 
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          )}
          <Input label="Email" type="email" placeholder="contoh@email.com" required />
          <Input label="Kata Sandi" type="password" placeholder="••••••••" required />
          <Button type="submit" className="w-full mt-2">
            {isLogin ? 'Masuk' : 'Daftar'}
          </Button>
        </form>
      </CardContent>
      <CardFooter className="flex justify-center">
        <p className="text-sm text-gray-500">
          {isLogin ? 'Belum punya akun? ' : 'Sudah punya akun? '}
          <button
            type="button"
            className="text-primary-600 font-medium hover:underline"
            onClick={() => setIsLogin(!isLogin)}
          >
            {isLogin ? 'Daftar sekarang' : 'Masuk di sini'}
          </button>
        </p>
      </CardFooter>
    </Card>
  );
}

export default function AuthPage() {
  return (
    <div className="flex-1 flex items-center justify-center p-4">
      <Suspense fallback={<div className="p-8 text-center text-gray-500">Memuat form...</div>}>
        <AuthForm />
      </Suspense>
    </div>
  );
}
