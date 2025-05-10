'use client';

import { motion, useAnimationControls } from 'framer-motion';
import React, { useCallback,useEffect, useRef, useState } from 'react';

// Default symbols in case the passed symbols are invalid
const DEFAULT_SYMBOLS = ['🎮', '🎰', '💰', '👾', '💎', '🍒', '7️⃣'];

interface ReelStripProps {
  symbols: string[];
  symbolHeight: number;
  spinning: boolean;
  spinDuration: number;
  spinDelay: number;
  onSpinComplete: (visibleSymbols: string[]) => void;
  pixelated?: boolean; // Optional prop for pixelated style
  reelIndex: number;   // Added to ensure different randomization per reel
}

export default function ReelStrip({
  symbols,
  symbolHeight,
  spinning,
  spinDuration,
  spinDelay,
  onSpinComplete,
  pixelated = false,
  reelIndex,
}: ReelStripProps) {
  // Create a larger set of symbols to enable continuous scrolling effect
  const [allSymbols, setAllSymbols] = useState<string[]>([]);
  const controls = useAnimationControls();
  const stripRef = useRef<HTMLDivElement>(null);
  const [isSpinning, setIsSpinning] = useState(false);
  const spinTimerRef = useRef<NodeJS.Timeout | null>(null);
  const [finalSymbols, setFinalSymbols] = useState<string[]>([]);
  
  // Sequential stop delay - each reel stops with a delay based on its index
  const sequentialStopDelay = reelIndex * 1000; // 1 second delay between each reel stopping
  
  // Create an expanded set of symbols for the scrolling effect
  useEffect(() => {
    if (symbols && Array.isArray(symbols) && symbols.length > 0) {
      // Repeat the symbols array many times to create a long strip
      setAllSymbols([...symbols, ...symbols, ...symbols, ...symbols, ...symbols, ...symbols, ...symbols]);
    }
  }, [symbols]);
  
  // Clean up any timers when component unmounts
  useEffect(() => {
    return () => {
      if (spinTimerRef.current) {
        clearTimeout(spinTimerRef.current);
        spinTimerRef.current = null;
      }
    };
  }, []);
  
  // Handle the spinning animation
  useEffect(() => {
    if (spinning && !isSpinning) {
      // Generate new final symbols each time we start spinning
      const newFinalSymbols = getVisibleSymbols();
      setFinalSymbols(newFinalSymbols);
      
      // Start spinning with CSS animation
      setIsSpinning(true);
      
      // Clear any existing timers
      if (spinTimerRef.current) {
        clearTimeout(spinTimerRef.current);
      }
      
      // Schedule when to stop spinning - adding sequential delay based on reel index
      const totalSpinTime = spinDuration * 1000 + spinDelay + sequentialStopDelay;
      console.log(`Reel ${reelIndex} will stop after ${totalSpinTime}ms`);
      
      spinTimerRef.current = setTimeout(() => {
        try {
          // 1. First, we'll capture the current position from the CSS animation
          let currentPosition = 0;
          if (stripRef.current) {
            const computedStyle = window.getComputedStyle(stripRef.current);
            const matrix = new DOMMatrix(computedStyle.transform);
            currentPosition = matrix.m42; // Y component of the transform matrix
          }
          
          // 2. Important: immediately stop the CSS animation
          setIsSpinning(false);
          
          // 3. Set the exact same position with Framer Motion so there's no jump
          controls.set({ y: currentPosition });
          
          // 4. Animate from current position to final position
          const basePosition = -1 * symbolHeight * symbols.length;
          
          // 5. Always animate in the same direction (downward) for proper slow-down
          // We ensure continuing downward by adding extra distance if needed
          // Calculate how far we need to travel to reach the appropriate end position
          const distanceToBase = basePosition - currentPosition;
          const targetPosition = distanceToBase > 0 
            ? basePosition - symbolHeight * symbols.length // Need to go around again
            : basePosition;
          
          // 6. Now perform the deceleration animation
          controls.start({
            y: targetPosition,
            transition: {
              duration: 1.4,
              ease: "easeOut",
            }
          }).then(() => {
            // 7. Ensure final position is precise
            controls.set({ y: basePosition });
            
            // 8. Notify that spin is complete
            onSpinComplete(newFinalSymbols);
          });
        } catch (error) {
          console.error("Animation error:", error);
          // Fallback in case of error
          setIsSpinning(false);
          controls.set({ y: -1 * symbolHeight * symbols.length });
          onSpinComplete(finalSymbols);
        }
      }, totalSpinTime);
    }
    // Force stop if needed
    else if (!spinning && isSpinning) {
      if (spinTimerRef.current) {
        clearTimeout(spinTimerRef.current);
        spinTimerRef.current = null;
      }
      
      try {
        // Similar approach for force stop
        let currentPosition = 0;
        if (stripRef.current) {
          const computedStyle = window.getComputedStyle(stripRef.current);
          const matrix = new DOMMatrix(computedStyle.transform);
          currentPosition = matrix.m42;
        }
        
        setIsSpinning(false);
        controls.set({ y: currentPosition });
        
        const basePosition = -1 * symbolHeight * symbols.length;
        const distanceToBase = basePosition - currentPosition;
        const targetPosition = distanceToBase > 0 
          ? basePosition - symbolHeight * symbols.length 
          : basePosition;
        
        controls.start({
          y: targetPosition,
          transition: {
            duration: 0.6,
            ease: "easeOut"
          }
        }).then(() => {
          controls.set({ y: basePosition });
          onSpinComplete(finalSymbols);
        });
      } catch (error) {
        console.error("Force stop animation error:", error);
        // Fallback
        setIsSpinning(false);
        controls.set({ y: -1 * symbolHeight * symbols.length });
        onSpinComplete(finalSymbols);
      }
    }
  }, [spinning, isSpinning, spinDuration, spinDelay, symbolHeight, symbols, controls, onSpinComplete, sequentialStopDelay]);
  
  // Function to get a set of random symbols for the reel when it stops spinning
  const getVisibleSymbols = useCallback((): string[] => {
    try {
      const safeSymbols = symbols || DEFAULT_SYMBOLS;
      console.log(`Reel ${reelIndex} preparing visible symbols from available:`, safeSymbols);
      
      // IMPORTANT: Order matters! These are positioned from top to bottom
      // We need to make sure the MIDDLE symbol is at index 1
      const visibleSymbols = [safeSymbols[0], safeSymbols[1], safeSymbols[2]];
      
      // Make absolutely certain we're returning valid strings
      const validatedSymbols = visibleSymbols.map(s => 
        typeof s === 'string' && s.length > 0 ? s : DEFAULT_SYMBOLS[0]
      );
      
      console.log(`Reel ${reelIndex} FINAL symbols (TOP|middle|bottom):`, validatedSymbols.join(' | '));
      console.log(`Reel ${reelIndex} PAYLINE SYMBOL (middle position): ${validatedSymbols[1]}`);
      return validatedSymbols;
    } catch (error) {
      console.error('Error generating visible symbols:', error);
      // Fallback symbols in case of error
      const fallback = DEFAULT_SYMBOLS.slice(0, 3);
      console.log(`Reel ${reelIndex} using FALLBACK symbols:`, fallback);
      return fallback;
    }
  }, [symbols, reelIndex]);
  
  return (
    <div className="relative overflow-hidden h-full w-full bg-white rounded">
      <motion.div
        className={`absolute w-full ${isSpinning ? 'spinning-reel' : ''}`}
        ref={stripRef}
        animate={controls}
        initial={{ y: -1 * symbolHeight * symbols.length }}
      >
        {allSymbols.map((symbol, index) => (
          <div
            key={index}
            className={`flex items-center justify-center w-full ${pixelated ? 'font-mono' : ''}`}
            style={{ 
              height: `${symbolHeight}px`,
              ...(pixelated ? { 
                imageRendering: 'pixelated',
                fontVariantNumeric: 'slashed-zero',
              } : {})
            }}
          >
            <span className={`text-6xl leading-none ${pixelated ? 'drop-shadow-[2px_2px_0_rgba(0,0,0,0.5)]' : ''}`}>
              {symbol}
            </span>
          </div>
        ))}
      </motion.div>
      
      {/* Selection window with subtle highlighting - no borders */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Top shadow gradient */}
        <div className="absolute top-0 left-0 right-0 h-2/5 bg-gradient-to-b from-black to-transparent opacity-30"></div>
        
        {/* Bottom shadow gradient */}
        <div className="absolute bottom-0 left-0 right-0 h-2/5 bg-gradient-to-t from-black to-transparent opacity-30"></div>
      </div>
      
      {/* Scanline effect for pixelated theme */}
      {pixelated && (
        <div className="absolute inset-0 pointer-events-none bg-scanline opacity-20"></div>
      )}
      
      {/* Center marker (invisible) to help with debugging alignment */}
      <div className="absolute left-0 right-0 top-1/2 transform -translate-y-1/2 h-[2px] opacity-0"></div>
    </div>
  );
} 