'use client';

import Head from 'next/head';
import * as React from 'react';
import '@/lib/env';

import '@/styles/scanline.css';

import UnstyledLink from '@/components/links/UnstyledLink';

/**
 * SVGR Support
 * Caveat: No React Props Type.
 *
 * You can override the next-env if the type is important to you
 * @see https://stackoverflow.com/questions/68103844/how-to-override-next-js-svg-module-declaration
 */
import Logo from '~/svg/Logo.svg';

// Custom CSS for pixelated button
const pixelButton = "border-2 border-r-4 border-b-4 border-black font-mono uppercase tracking-wide transition-all";

// !STARTERCONF -> Select !STARTERCONF and CMD + SHIFT + F
// Before you begin editing, follow all comments with `STARTERCONF`,
// to customize the default configuration.

export default function HomePage() {
  return (
    <main className="relative">
      <Head>
        <title>Agentic</title>
      </Head>
      
      {/* Global scanline effect */}
      <div className="fixed inset-0 bg-scanline opacity-20 pointer-events-none z-10"></div>
      
      <section className='bg-black'>
        <div className='layout relative flex min-h-screen flex-col items-center justify-center py-12 text-center'>
          {/* Background grid pattern for arcade feel */}
          <div 
            className="absolute inset-0 opacity-15 z-0" 
            style={{ 
              backgroundImage: 'linear-gradient(#2c2c8e 1px, transparent 1px), linear-gradient(90deg, #2c2c8e 1px, transparent 1px)',
              backgroundSize: '20px 20px'
            }}
          ></div>
          
          <div className="relative z-1">
            <div className="mb-8 w-24 h-24 mx-auto bg-indigo-600 flex items-center justify-center border-2 border-r-4 border-b-4 border-black">
              <Logo className='w-16 filter invert' />
            </div>
            
            <h1 
              className="text-6xl font-bold text-yellow-400 mb-4 font-mono uppercase tracking-wide glitch"
              data-text="Agentic"
            >
              Agentic
            </h1>
            
            <p className='mt-4 mb-8 text-lg text-purple-400 font-mono uppercase'>
              Retro Arcade Slot Machine Game
            </p>
            
            <div className="max-w-md mx-auto bg-indigo-900 p-6 border-2 border-r-4 border-b-4 border-black mb-8">
              <h2 className="text-yellow-400 font-mono uppercase text-xl mb-4">Game Features</h2>
              <ul className="text-left text-white font-mono text-sm space-y-2">
                <li>• Start with $1000 virtual coins</li>
                <li>• Place bets from $5 to your entire balance</li>
                <li>• Win up to 30x your bet with matching symbols</li>
                <li>• Match pairs for 2x multiplier</li>
                <li>• Retro pixel art style and animations</li>
                <li>• CRT scanline effects for authentic arcade feel</li>
              </ul>
            </div>

            <div className="grid gap-4 max-w-md mx-auto">
              <button
                onClick={() => window.location.href = '/slots'}
                className={`${pixelButton} bg-green-600 hover:bg-green-500 text-white py-4 px-8 text-xl`}
              >
                ► PLAY GAME
              </button>
              
              <button
                onClick={() => window.location.href = '/components'}
                className={`${pixelButton} bg-blue-600 hover:bg-blue-500 text-white py-2 px-8`}
              >
                COMPONENTS
              </button>
              
              <UnstyledLink
                href='https://github.com/yourusername/pixel-slots'
                className={`${pixelButton} bg-gray-700 hover:bg-gray-600 text-white py-2 px-8 flex items-center justify-center`}
              >
                <span className="mr-2">GITHUB REPO</span>
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
                </svg>
              </UnstyledLink>
            </div>

            <footer className='absolute bottom-2 text-gray-400 font-mono text-xs'>
              <p>(C) 2025 ARCADE ENTERPRISES</p>
              <p className="mt-1">PRESS START TO CONTINUE</p>
            </footer>
          </div>
        </div>
      </section>
    </main>
  );
}
