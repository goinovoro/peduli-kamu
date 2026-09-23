"use client";

import React from 'react';
import Link from 'next/link';
import { HeartPulse, Menu, X, LogOut, User as UserIcon, Search, Briefcase } from 'lucide-react';
import { usePeduliStore } from '@/store/usePeduliStore';
import { Button } from '@/components/ui/Button';

export function Navbar() {
  const { user, logout } = usePeduliStore();
  const [isOpen, setIsOpen] = React.useState(false);

  const toggleMenu = () => setIsOpen(!isOpen);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-gray-100 bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center space-x-2 text-primary-600">
          <HeartPulse className="h-6 w-6" />
          <span className="font-bold text-lg tracking-tight">Peduli Kamu</span>
        </Link>
        
        {/* Desktop Nav */}
        <div className="hidden md:flex items-center space-x-4">
          {user ? (
            <>
              <span className="text-sm text-gray-500 font-medium mr-2">Halo, {user.name}</span>
              {user.role === 'family' && (
                <>
                  <Link href="/packages">
                    <Button variant="ghost" size="sm" className="space-x-2">
                      <span>Paket Layanan</span>
                    </Button>
                  </Link>
                  <Link href="/family/find">
                    <Button variant="ghost" size="sm" className="space-x-2">
                      <Search className="w-4 h-4" />
                      <span>Cari Perawat</span>
                    </Button>
                  </Link>
                </>
              )}
              {user.role === 'caregiver' && (
                <Link href="/dashboard/jobs">
                  <Button variant="ghost" size="sm" className="space-x-2">
                    <Briefcase className="w-4 h-4" />
                    <span>Bursa Permintaan</span>
                  </Button>
                </Link>
              )}
              <Link href={user.role === 'family' ? '/family/dashboard' : '/caregiver/dashboard'}>
                <Button variant="ghost" size="sm" className="space-x-2">
                  <UserIcon className="w-4 h-4" />
                  <span>Dashboard</span>
                </Button>
              </Link>
              <Button variant="outline" size="sm" onClick={logout}>Keluar</Button>
            </>
          ) : (
            <>
              <Link href="/auth">
                <Button variant="ghost" size="sm">Masuk</Button>
              </Link>
              <Link href="/auth">
                <Button size="sm">Daftar</Button>
              </Link>
            </>
          )}
        </div>

        {/* Mobile Menu Toggle */}
        <button className="md:hidden p-2 text-gray-600" onClick={toggleMenu}>
          {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {/* Mobile Nav */}
      {isOpen && (
        <div className="md:hidden border-t border-gray-100 bg-background p-4 flex flex-col space-y-4 shadow-lg">
          {user ? (
            <>
              <div className="px-2 py-1 text-sm font-medium text-gray-500">Halo, {user.name}</div>
              {user.role === 'family' && (
                <>
                  <Link href="/packages" onClick={toggleMenu}>
                    <Button variant="ghost" className="w-full justify-start space-x-2">
                      <span>Paket Layanan</span>
                    </Button>
                  </Link>
                  <Link href="/family/find" onClick={toggleMenu}>
                    <Button variant="ghost" className="w-full justify-start space-x-2">
                      <Search className="w-4 h-4" />
                      <span>Cari Perawat</span>
                    </Button>
                  </Link>
                </>
              )}
              {user.role === 'caregiver' && (
                <Link href="/dashboard/jobs" onClick={toggleMenu}>
                  <Button variant="ghost" className="w-full justify-start space-x-2">
                    <Briefcase className="w-4 h-4" />
                    <span>Bursa Permintaan</span>
                  </Button>
                </Link>
              )}
              <Link href={user.role === 'family' ? '/family/dashboard' : '/caregiver/dashboard'} onClick={toggleMenu}>
                <Button variant="ghost" className="w-full justify-start space-x-2">
                  <UserIcon className="w-4 h-4" />
                  <span>Dashboard</span>
                </Button>
              </Link>
              <Button variant="outline" className="w-full justify-start space-x-2 text-red-500 border-red-100 hover:bg-red-50" onClick={() => { logout(); toggleMenu(); }}>
                <LogOut className="w-4 h-4" />
                <span>Keluar</span>
              </Button>
            </>
          ) : (
            <>
              <Link href="/auth" onClick={toggleMenu}>
                <Button variant="ghost" className="w-full justify-start">Masuk</Button>
              </Link>
              <Link href="/auth" onClick={toggleMenu}>
                <Button className="w-full justify-start">Daftar</Button>
              </Link>
            </>
          )}
        </div>
      )}
    </header>
  );
}
