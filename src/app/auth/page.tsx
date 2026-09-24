"use client";

import React, { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { usePeduliStore, Role } from '@/store/usePeduliStore';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { createClient } from '@/lib/supabase/client';

function AuthForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const defaultRole = (searchParams.get('role') as Role) || 'family';
  
  const [role, setRole] = useState<Role>(defaultRole);
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  
  const { login } = usePeduliStore();
  const supabase = createClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    try {
      if (isLogin) {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;
        
        // Push user state to Zustand
        if (data.user) {
          login({
            id: data.user.id,
            name: data.user.user_metadata?.name || 'User',
            role: (data.user.user_metadata?.role as Role) || role,
            email: data.user.email || email
          });
        }
        const actualRole = data.user?.user_metadata?.role || role;
        if (actualRole === 'family') {
          window.location.href = '/family/dashboard';
        } else {
          window.location.href = '/caregiver/dashboard';
        }
      } else {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              name: name,
              role: role,
            }
          }
        });

        if (error) throw error;
        
        // If email confirmation is required, session will be null
        if (data.user && !data.session) {
          setErrorMsg('Pendaftaran berhasil! Silakan periksa kotak masuk/spam email Anda untuk verifikasi.');
          return; // Stop here, do not redirect yet
        }
        
        if (data.user) {
           login({
            id: data.user.id,
            name: name,
            role: role,
            email: email
          });
        }
        
        if (role === 'family') {
          window.location.href = '/family/dashboard';
        } else {
          window.location.href = '/caregiver/dashboard';
        }
      }
    } catch (error: any) {
      setErrorMsg(error.message || 'Terjadi kesalahan');
    } finally {
      setLoading(false);
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
          {errorMsg && (
            <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg">
              {errorMsg}
            </div>
          )}
          {!isLogin && (
            <Input 
              label="Nama Lengkap" 
              placeholder="Masukkan nama Anda" 
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          )}
          <Input 
            label="Email" 
            type="email" 
            placeholder="contoh@email.com" 
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required 
          />
          <Input 
            label="Kata Sandi" 
            type="password" 
            placeholder="••••••••" 
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required 
          />
          <Button type="submit" className="w-full mt-2" disabled={loading}>
            {loading ? 'Memproses...' : (isLogin ? 'Masuk' : 'Daftar')}
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
