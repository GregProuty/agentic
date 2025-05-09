'use client';

import Link from 'next/link';
import React from 'react';

import '@/styles/scanline.css';

import SlotMachine from '@/components/SlotMachine/SlotMachine';
import { WalletProvider } from '@/components/SlotMachine/WalletContext';

export default function SlotsPage() {
  return (
    <WalletProvider>
      <main className="flex min-h-screen flex-col items-center justify-between p-8 bg-black relative">
        {/* Global scanline effect */}
        <div className="absolute inset-0 bg-scanline opacity-30 pointer-events-none z-10"></div>
        
        {/* Background grid pattern for arcade feel */}
        <div 
          className="absolute inset-0 opacity-20 z-0" 
          style={{ 
            backgroundImage: 'linear-gradient(#2c2c8e 1px, transparent 1px), linear-gradient(90deg, #2c2c8e 1px, transparent 1px)',
            backgroundSize: '20px 20px'
          }}
        ></div>
        
        <div className="w-full max-w-2xl mx-auto z-1 relative">
          <div className="mb-8 text-center">
            <h1 
              className="text-6xl font-bold text-yellow-400 mb-4 font-mono uppercase tracking-wide glitch"
              data-text="Agentic"
            >
              Agentic
            </h1>
            <p className="text-purple-400 font-mono text-lg">INSERT COIN TO PLAY</p>
            <div className="flex justify-center my-4">
              {[1, 2, 3].map((_, i) => (
                <div key={i} className="w-3 h-3 bg-green-500 mx-1 animate-pulse"></div>
              ))}
            </div>
          </div>
          
          <div className="mb-6">
            <SlotMachine className="mx-auto" />
          </div>
          
          <div className="mt-12 text-center font-mono text-sm">
            <div className="inline-block border-2 border-r-4 border-b-4 border-blue-500 px-4 py-2 bg-blue-800 hover:bg-blue-700 transition">
              <Link href="/" className="text-white hover:text-yellow-300">
                &lt; BACK TO MAIN MENU
              </Link>
            </div>
          </div>
          
          {/* Arcade footer */}
          <div className="mt-16 text-center text-gray-500 font-mono text-xs">
            <p>(C) 2025 ARCADE ENTERPRISES</p>
            <p className="mt-1">ALL RIGHTS RESERVED - INSERT COIN TO CONTINUE</p>
          </div>
        </div>
      </main>
    </WalletProvider>
  );
} 