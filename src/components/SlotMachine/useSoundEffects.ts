'use client';

import { useEffect,useRef } from 'react';

// Custom hook for slot machine sound effects
export function useSoundEffects() {
  // Create refs for audio elements
  const leverSoundRef = useRef<HTMLAudioElement | null>(null);
  const spinningRef = useRef<HTMLAudioElement | null>(null);
  const winSoundRef = useRef<HTMLAudioElement | null>(null);
  
  // Initialize audio elements on client side only
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Create audio elements
      leverSoundRef.current = new Audio('/sounds/lever-pull.mp3');
      spinningRef.current = new Audio('/sounds/spinning.mp3');
      winSoundRef.current = new Audio('/sounds/win.mp3');
      
      // Configure audio elements
      if (spinningRef.current) {
        spinningRef.current.loop = true;
        spinningRef.current.volume = 0.5;
      }
      
      if (leverSoundRef.current) {
        leverSoundRef.current.volume = 0.7;
      }
      
      if (winSoundRef.current) {
        winSoundRef.current.volume = 0.8;
      }
    }
    
    // Cleanup on unmount
    return () => {
      leverSoundRef.current = null;
      spinningRef.current = null;
      winSoundRef.current = null;
    };
  }, []);
  
  // Function to play lever pull sound
  const playLeverSound = () => {
    if (leverSoundRef.current) {
      leverSoundRef.current.currentTime = 0;
      leverSoundRef.current.play().catch(err => console.log('Audio play error:', err));
    }
  };
  
  // Function to start spinning sound
  const startSpinningSound = () => {
    if (spinningRef.current) {
      spinningRef.current.currentTime = 0;
      spinningRef.current.play().catch(err => console.log('Audio play error:', err));
    }
  };
  
  // Function to stop spinning sound
  const stopSpinningSound = () => {
    if (spinningRef.current) {
      spinningRef.current.pause();
      spinningRef.current.currentTime = 0;
    }
  };
  
  // Function to play win sound
  const playWinSound = () => {
    if (winSoundRef.current) {
      winSoundRef.current.currentTime = 0;
      winSoundRef.current.play().catch(err => console.log('Audio play error:', err));
    }
  };
  
  return {
    playLeverSound,
    startSpinningSound,
    stopSpinningSound,
    playWinSound,
  };
} 