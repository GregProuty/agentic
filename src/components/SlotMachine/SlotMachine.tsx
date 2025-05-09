'use client';

import { clsx } from 'clsx';
import { motion } from 'framer-motion';
import React, { useCallback,useEffect,useRef, useState } from 'react';
import { twMerge } from 'tailwind-merge';

import BetControls from './BetControls';
import ReelStrip from './ReelStrip';
import { useSoundEffects } from './useSoundEffects';
import { useWallet } from './WalletContext';

// Import custom utility function to merge classnames
type ClassValue = string | number | boolean | undefined | null | Record<string, unknown> | ClassValue[];

const cn = (...inputs: ClassValue[]) => {
  return twMerge(clsx(inputs));
};

// Define the symbols that will appear on the reels - using retro game icons
const SYMBOLS = ['👾', '🎮', '👹', '🏆', '💣', '🔮', '🎲'];

// Create three different sets of symbols for the reels
const REEL_SYMBOLS = [
  ['👾', '🎮', '👹', '🏆', '💣', '🔮', '🎲'],
  ['🎲', '👾', '🎮', '💣', '🏆', '👹', '🔮'],
  ['🔮', '💣', '🎲', '👾', '🎮', '👹', '🏆'],
];

// Symbol height in pixels (for animation)
const SYMBOL_HEIGHT = 60;

// Payout multipliers for different symbol combinations
const PAYOUTS = {
  '👾👾👾': 15,  // Triple 👾: 15x bet
  '🎮🎮🎮': 10,  // Triple 🎮: 10x bet
  '👹👹👹': 20,  // Triple 👹: 20x bet
  '🏆🏆🏆': 30,  // Triple 🏆: 30x bet (jackpot)
  '💣💣💣': 25,  // Triple 💣: 25x bet
  '🔮🔮🔮': 12,  // Triple 🔮: 12x bet
  '🎲🎲🎲': 8,   // Triple 🎲: 8x bet
  'ANY_PAIR': 2  // Any pair: 2x bet
};

// At the top, add a constant for number of reels
const NUM_REELS = 3;

// Define props for the SlotMachine component
interface SlotMachineProps {
  className?: string;
}

export default function SlotMachine({ className }: SlotMachineProps) {
  const [spinning, setSpinning] = useState(false);
  const [reelsCompleted, setReelsCompleted] = useState(0);
  const [leverPulled, setLeverPulled] = useState(false);
  const [win, setWin] = useState(false);
  const [winAmount, setWinAmount] = useState(0);
  const [resultSymbols, setResultSymbols] = useState<string[]>([]);
  const [showInsufficientFunds, setShowInsufficientFunds] = useState(false);
  const [gameHistory, setGameHistory] = useState<{amount: number, isWin: boolean, symbols?: string[]}[]>([]);
  const [showLastResult, setShowLastResult] = useState(false);
  const [sessionBalance, setSessionBalance] = useState(0);
  const [currentStreak, setCurrentStreak] = useState({ count: 0, type: '' });
  const leverRef = useRef<HTMLDivElement>(null);
  const spinTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Get wallet functions
  const wallet = useWallet();
  
  // Sound effects
  const { playLeverSound, startSpinningSound, stopSpinningSound, playWinSound } = useSoundEffects();

  // State to store the current reel symbols - can be randomized before each spin
  const [currentReelSymbols, setCurrentReelSymbols] = useState<string[][]>(REEL_SYMBOLS);

  // Calculate stats
  const totalGames = gameHistory.length;
  const winCount = gameHistory.filter(game => game.isWin).length;
  const winPercentage = totalGames > 0 ? Math.round((winCount / totalGames) * 100) : 0;

  // Update streak when game history changes
  useEffect(() => {
    if (gameHistory.length === 0) return;
    
    console.log("Game history updated:", gameHistory);
    
    const lastGameWin = gameHistory[0].isWin;
    
    if (currentStreak.count === 0 || lastGameWin !== (currentStreak.type === 'win')) {
      // Start new streak
      setCurrentStreak({
        count: 1,
        type: lastGameWin ? 'win' : 'loss'
      });
    } else {
      // Continue current streak
      setCurrentStreak(prev => ({
        ...prev,
        count: prev.count + 1
      }));
    }
  }, [gameHistory]);

  // Clean up any timers when component unmounts
  useEffect(() => {
    return () => {
      if (spinTimeoutRef.current) {
        clearTimeout(spinTimeoutRef.current);
      }
    };
  }, []);

  // Function to handle a reel completing its spin
  const handleReelComplete = (reelIndex: number, visibleSymbols: string[]) => {
    // Ensure we have valid symbols
    if (!visibleSymbols || visibleSymbols.length < 3) {
      console.error("Invalid symbols received from reel", reelIndex, visibleSymbols);
      return;
    }
    
    console.log(`🎰 Reel ${reelIndex} completed with visible rows:`, visibleSymbols.join(" | "));
    console.log(` Row order is: TOP[0] | MIDDLE[1] | BOTTOM[2]`);
    
    // FIXED: The MIDDLE symbol is at index 1 in the visibleSymbols array
    const newResults = [...resultSymbols];
    const middleSymbol = visibleSymbols[1]; // Index 1 is the MIDDLE symbol
    newResults[reelIndex] = middleSymbol;
    console.log(`🎯 Adding MIDDLE PAYLINE symbol for reel ${reelIndex}: ${middleSymbol}`);
    setResultSymbols(newResults);
    
    // Increment completed reels counter
    const updatedReelsCompleted = reelsCompleted + 1;
    setReelsCompleted(updatedReelsCompleted);
    
    // If all three reels have completed, check for win
    if (updatedReelsCompleted === NUM_REELS) {
      console.log("🎯 All reels completed!");
      console.log("⭐ Final MIDDLE row symbols for win check:", newResults.join(" | "));
      
      // Ensure we have exactly 3 valid symbols before checking for win
      if (newResults.length === NUM_REELS && newResults.every(s => typeof s === 'string' && s.length > 0)) {
        console.log("✅ Valid results, checking for win with MIDDLE symbols...");
        
        // Create a fresh copy to avoid any reference issues
        const finalSymbols = [...newResults];
        
        // Wait a moment before checking win to let animations finish
        setTimeout(() => {
          // Check win with ONLY the middle row symbols
          checkForWin(finalSymbols);
          
          // Reset for next spin
          setReelsCompleted(0);
          setSpinning(false);
          stopSpinningSound();
        }, 800);
      } else {
        console.error("❌ Invalid final results:", newResults);
        
        // Try to recover from invalid results - use a fallback symbols array
        const fallbackSymbols = currentReelSymbols.map(reelSymbols => reelSymbols[1]); // Use middle symbols
        console.log("⚠️ Using fallback symbols:", fallbackSymbols.join(" | "));
        
        setTimeout(() => {
          checkForWin(fallbackSymbols);
          
          // Reset for next spin
          setReelsCompleted(0);
          setSpinning(false);
          stopSpinningSound();
        }, 800);
      }
    }
  };
  
  // Check for winning combinations - completely rewritten pair detection logic
  const checkForWin = (symbols: string[]) => {
    console.log("🎮 CHECKING WIN with MIDDLE ROW symbols:", symbols.join(" | "));
    console.log("🎮 These are the PAYLINE symbols from the MIDDLE of each reel");
    
    // Ensure we have 3 symbols
    if (symbols.length !== NUM_REELS || symbols.some(s => !s)) {
      console.log("❌ Incomplete symbols, no win", symbols);
      
      // No win - display loss
      setWin(false);
      setWinAmount(0);
      
      // Get the exact bet amount that was placed
      const betAmount = wallet.currentBet;
      console.log("💸 Loss amount:", betAmount);
      
      // Record loss in history with the actual bet amount
      const updatedHistory = [{amount: betAmount, isWin: false, symbols}, ...gameHistory.slice(0, 9)];
      console.log("📝 Updating game history with loss, final MIDDLE ROW symbols:", symbols.join(" "));
      setGameHistory(updatedHistory);
      
      // Update session balance - already deducted in wallet.placeBet()
      setSessionBalance(prev => prev - betAmount);
      
      // Force show the loss message
      setShowLastResult(true);
      
      // Let result display for a while before clearing
      setTimeout(() => {
        setShowLastResult(false);
      }, 3000);
      
      return;
    }
    
    // STEP 1: Check if all three symbols are identical (triple)
    if (symbols[0] === symbols[1] && symbols[1] === symbols[2]) {
      console.log("🎯 TRIPLE DETECTED in MIDDLE ROW!", symbols[0]);
      const tripleKey = `${symbols[0]}${symbols[0]}${symbols[0]}`;
      const multiplier = PAYOUTS[tripleKey as keyof typeof PAYOUTS] || 5;
      const winnings = wallet.currentBet * multiplier;
      
      console.log(`🎮 Triple match! ${tripleKey} with multiplier ${multiplier}`);
      console.log("💰 Win amount:", winnings);
      
      // Record win in history
      const updatedHistory = [{amount: winnings, isWin: true, symbols}, ...gameHistory.slice(0, 9)];
      console.log("📝 Updating game history with triple win:", updatedHistory);
      setGameHistory(updatedHistory);
      
      // Update win state to show win animation
      setWin(true);
      setWinAmount(winnings);
      
      // Update wallet balance
      wallet.addToBalance(winnings);
      playWinSound();
      
      // Force show the win message
      setShowLastResult(true);
      
      // Update session balance - bet was already deducted in wallet.placeBet()
      setSessionBalance(prev => prev + winnings);
      
      // Let result display for a while before clearing
      setTimeout(() => {
        setWin(false);
        setWinAmount(0);
        setShowLastResult(false);
      }, 3000);
      
      return;
    }
    
    // STEP 2: Explicitly check each pair possibility
    const isPair01 = symbols[0] === symbols[1];
    const isPair12 = symbols[1] === symbols[2]; 
    const isPair02 = symbols[0] === symbols[2];
    
    // Debug log each pair check for clarity
    console.log(`🔍 Pair 0-1 check: "${symbols[0]}" vs "${symbols[1]}" => ${isPair01}`);
    console.log(`🔍 Pair 1-2 check: "${symbols[1]}" vs "${symbols[2]}" => ${isPair12}`);
    console.log(`🔍 Pair 0-2 check: "${symbols[0]}" vs "${symbols[2]}" => ${isPair02}`);
    
    // STEP 3: If any pair is found, it's a win
    if (isPair01 || isPair12 || isPair02) {
      console.log("🎯 PAIR DETECTED in MIDDLE ROW!");
      
      // Log which specific pair was found
      if (isPair01) console.log(`🎮 Matching pair at positions 0-1: ${symbols[0]}`);
      if (isPair12) console.log(`🎮 Matching pair at positions 1-2: ${symbols[1]}`);
      if (isPair02) console.log(`🎮 Matching pair at positions 0-2: ${symbols[0]}`);
      
      const winnings = wallet.currentBet * PAYOUTS['ANY_PAIR'];
      
      console.log(`🎮 Pair match! Multiplier ${PAYOUTS['ANY_PAIR']}`);
      console.log("💰 Win amount:", winnings);
      
      // Record win in history
      const updatedHistory = [{amount: winnings, isWin: true, symbols}, ...gameHistory.slice(0, 9)];
      console.log("📝 Updating game history with pair win:", updatedHistory);
      setGameHistory(updatedHistory);
      
      // Update win state to show win animation
      setWin(true);
      setWinAmount(winnings);
      
      // Update wallet balance
      wallet.addToBalance(winnings);
      playWinSound();
      
      // Force show the win message
      setShowLastResult(true);
      
      // Update session balance
      setSessionBalance(prev => prev + winnings);
      
      // Let result display for a while before clearing
      setTimeout(() => {
        setWin(false);
        setWinAmount(0);
        setShowLastResult(false);
      }, 3000);
      
      return;
    }
    
    // STEP 4: If we reach here, there's no win
    console.log("❌ NO WIN - No pairs or triples found in MIDDLE ROW symbols:", symbols.join(","));
    
    // No win - display loss
    setWin(false);
    setWinAmount(0);
    
    // Get the exact bet amount that was placed
    const betAmount = wallet.currentBet;
    console.log("💸 Loss amount:", betAmount);
    
    // Update session balance - already deducted in wallet.placeBet()
    setSessionBalance(prev => prev - betAmount);
    
    // Force show the loss message
    setShowLastResult(true);
    
    // Record loss in history with the actual bet amount
    const updatedHistory = [{amount: betAmount, isWin: false, symbols}, ...gameHistory.slice(0, 9)];
    console.log("📝 Updating game history with loss, final MIDDLE ROW symbols:", symbols.join(" "));
    setGameHistory(updatedHistory);
    
    // Let result display for a while before clearing
    setTimeout(() => {
      setShowLastResult(false);
    }, 3000);
  };

  // Function to spin the reels
  const spinReels = useCallback(() => {
    if (spinning) return;
    
    if (wallet.balance < wallet.currentBet) {
      setShowInsufficientFunds(true);
      setTimeout(() => setShowInsufficientFunds(false), 2000);
      return;
    }
    
    // Place bet
    wallet.placeBet();
    
    // Reset the previous result to clear any win/loss displays
    setShowLastResult(false);
    setWin(false);
    setWinAmount(0);
    
    // Randomize the symbols for each reel to ensure different results each time
    const newReelSymbols = REEL_SYMBOLS.map(reelSymbols => {
      // Create a shuffled copy of the symbols
      return [...reelSymbols].sort(() => Math.random() - 0.5);
    });
    
    // Update the reel symbols state
    setCurrentReelSymbols(newReelSymbols);
    
    setSpinning(true);
    setReelsCompleted(0);
    setResultSymbols([]);
    playLeverSound();
    
    // Pull lever animation
    if (leverRef.current) {
      setLeverPulled(true);
      setTimeout(() => setLeverPulled(false), 500);
    }
    
    // Start spinning sound
    startSpinningSound();
    
    // Clear any existing timeout
    if (spinTimeoutRef.current) {
      clearTimeout(spinTimeoutRef.current);
    }
    
    // Set a timeout to automatically stop spinning after a certain time
    spinTimeoutRef.current = setTimeout(() => {
      setSpinning(false);
    }, 10000); // 10 seconds is longer than the longest expected spin time
  }, [spinning, wallet, playLeverSound, startSpinningSound]);

  // Border style for pixelated look
  const pixelBorder = "border-2 border-r-4 border-b-4 border-black";

  return (
    <div className={cn('flex flex-col items-center', className)}>
      <div className={cn(
        "relative w-full max-w-md bg-indigo-900 rounded-none p-8 shadow-[8px_8px_0_0_rgba(0,0,0,1)]",
        pixelBorder,
        win && "animate-bounce"
      )}>
        {/* Cabinet top - pixelated */}
        <div className={cn("absolute -top-10 left-0 right-0 h-10 bg-indigo-700", pixelBorder, "border-b-0")}></div>
        
        {/* Machine title - pixel art style */}
        <div className={cn("absolute -top-8 left-1/2 transform -translate-x-1/2 bg-yellow-400 px-6 py-1 font-bold text-xl", pixelBorder, "font-mono uppercase tracking-wider text-indigo-900")}>
          PIXEL SLOTS
        </div>
        
        {/* Win notification - pixelated */}
        {win && (
          <div className={cn("absolute -top-16 left-1/2 transform -translate-x-1/2 bg-green-500 px-4 py-2 font-bold text-xl animate-pulse z-10", pixelBorder, "font-mono uppercase")}>
            WIN ${winAmount}! 🎮
          </div>
        )}
        
        {/* Insufficient funds notification */}
        {showInsufficientFunds && (
          <div className={cn("absolute -top-16 left-1/2 transform -translate-x-1/2 bg-red-500 px-4 py-2 font-bold text-sm animate-pulse z-10", pixelBorder, "font-mono uppercase")}>
            INSUFFICIENT FUNDS!
          </div>
        )}
        
        {/* Reels container with payline indicator */}
        <div className={cn("bg-black p-4 mb-6 grid grid-cols-3 gap-2 relative", pixelBorder)}>
          {/* Payline indicator - makes it clear which row is used for wins */}
          <div className="absolute left-0 right-0 top-1/2 transform -translate-y-1/2 z-10 pointer-events-none">
            <div className="flex justify-between px-2">
              <div className={cn("h-1 w-4 bg-yellow-400", !spinning && "animate-pulse")}></div>
              <div className={cn("h-1 w-4 bg-yellow-400", !spinning && "animate-pulse")}></div>
            </div>
            {win && (
              <div className="absolute left-0 right-0 h-[4px] bg-yellow-400 opacity-50 top-1/2 transform -translate-y-1/2"></div>
            )}
          </div>

          {REEL_SYMBOLS.map((symbols, index) => (
            <div 
              key={index} 
              className={cn(
                "h-40 relative", 
                pixelBorder, 
                "bg-gray-900 overflow-hidden",
                // Add smooth shadows to improve visual appearance
                "shadow-inner",
                // Add subtle glow when spinning
                spinning && "after:absolute after:inset-0 after:bg-blue-500 after:opacity-10 after:animate-pulse"
              )}
            >
              {/* Glass reflection effect */}
              <div className="absolute inset-0 bg-gradient-to-b from-white to-transparent opacity-5 z-10 pointer-events-none"></div>
              
              <ReelStrip
                symbols={currentReelSymbols[index]}
                symbolHeight={SYMBOL_HEIGHT}
                spinning={spinning}
                spinDuration={0.9 + index * 0.6 + (Math.random() * 0.2)} // Add small random component to timing
                spinDelay={index * 150 + (Math.random() * 30)} // Add random component to delay
                onSpinComplete={(visibleSymbols) => handleReelComplete(index, visibleSymbols)}
                pixelated={true}
                reelIndex={index}
              />
              
              {/* Center line indicator - highlight the winning row */}
              <div className="absolute left-0 right-0 top-1/2 transform -translate-y-1/2 h-[1px] bg-transparent pointer-events-none">
                {/* Visual guide to show which symbols count for winning */}
                {!spinning && (
                  <div className="absolute left-1 h-1 w-1 bg-yellow-400 rounded-full"></div>
                )}
              </div>
              
              {/* Inner glow effect during spinning */}
              {spinning && (
                <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-blue-500 to-purple-500 opacity-10 mix-blend-overlay"></div>
              )}
            </div>
          ))}
        </div>
        
        {/* Current bet display - now also shows win/loss messages */}
        <div className={cn(
          "bg-black py-3 px-4 mx-auto mb-4 font-mono text-center relative overflow-hidden", 
          pixelBorder,
          (win || (showLastResult && gameHistory.length > 0)) ? "border-4 border-yellow-400" : ""
        )}>
          {/* CRT screen effect */}
          <div className="absolute inset-0 pointer-events-none bg-scanline opacity-10 mix-blend-overlay"></div>
          
          {win ? (
            <>
              <motion.div 
                className="text-yellow-400 text-sm font-bold animate-pulse"
                initial={{ scale: 0.8 }}
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 0.5, repeat: 2 }}
              >
                YOU WON!
              </motion.div>
              <motion.div 
                className="text-green-400 text-2xl font-bold"
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                +${winAmount}
              </motion.div>
            </>
          ) : showLastResult && gameHistory.length > 0 && !gameHistory[0].isWin ? (
            <>
              <motion.div 
                className="text-red-400 text-sm font-bold"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                YOU LOST
              </motion.div>
              <motion.div 
                className="text-red-400 text-2xl font-bold"
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                -${Math.abs(gameHistory[0].amount)}
              </motion.div>
            </>
          ) : (
            <>
              <div className="text-yellow-400 text-sm">CURRENT BET</div>
              <div className="text-green-400 text-lg">${wallet.currentBet}</div>
            </>
          )}
          
          {/* Flashing light effect for wins */}
          {win && (
            <motion.div 
              className="absolute inset-0 bg-yellow-400 pointer-events-none" 
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 0.2, 0] }}
              transition={{ duration: 0.5, repeat: 3, repeatType: "reverse" }}
            />
          )}
          
          {/* Loss effect */}
          {showLastResult && gameHistory.length > 0 && !gameHistory[0].isWin && (
            <motion.div 
              className="absolute inset-0 bg-red-800 pointer-events-none" 
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 0.1, 0] }}
              transition={{ duration: 0.8, repeat: 1 }}
            />
          )}
        </div>
        
        {/* Scanline effect for CRT look */}
        <div className="absolute inset-0 pointer-events-none bg-scanline opacity-10 mix-blend-overlay"></div>
        
        {/* Light indicators - pixelated */}
        <div className="absolute -bottom-3 left-1/2 transform -translate-x-1/2 flex space-x-4">
          {[0, 1, 2, 3, 4].map((_, index) => (
            <div 
              key={index} 
              className={cn(
                `w-4 h-4 ${pixelBorder}`,
                spinning 
                  ? index % 2 === 0 
                    ? 'bg-yellow-300 animate-pulse' 
                    : 'bg-red-500 animate-pulse' 
                  : win
                    ? 'bg-green-500 animate-pulse'
                    : 'bg-gray-800'
              )}
            ></div>
          ))}
        </div>
        
        {/* Control panel - pixelated */}
        <div className={cn("bg-indigo-800 p-4 flex justify-between items-center", pixelBorder)}>
          <div className="text-yellow-300 font-bold font-mono uppercase">PRESS TO SPIN</div>
          
          {/* Arcade button instead of lever */}
          <div className="relative h-16 w-16">
            <motion.div 
              ref={leverRef}
              className={cn("absolute w-14 h-14 bg-red-600 rounded-full cursor-pointer shadow-[0_4px_0_0_#7f1d1d]", pixelBorder)}
              animate={leverPulled ? { y: 4, boxShadow: '0 0 0 0 #7f1d1d' } : { y: 0, boxShadow: '0 4px 0 0 #7f1d1d' }}
              transition={{ duration: 0.1 }}
              onClick={spinReels}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 font-mono font-bold text-white">SPIN</div>
            </motion.div>
          </div>
        </div>
        
        {/* Pixel coin slot */}
        <div className={cn("absolute -right-6 top-1/3 w-6 h-12 bg-gray-700", pixelBorder)}>
          <div className={cn("w-4 h-1 bg-black mx-auto mt-2", "border border-gray-600")}></div>
        </div>
      </div>
      
      {/* Bet controls */}
      <BetControls disabled={spinning} />
      
      {/* Latest result display - pixelated retro style */}
      {showLastResult && gameHistory.length > 0 && (
        <motion.div 
          className={cn("mt-4 max-w-md w-full bg-black p-3", pixelBorder)}
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 20, opacity: 0 }}
          transition={{ type: "spring", damping: 12 }}
        >
          <div className="relative overflow-hidden">
            {/* Scanline effect for CRT look */}
            <div className="absolute inset-0 pointer-events-none bg-scanline opacity-20 mix-blend-overlay"></div>
            
            <div className={cn(
              "flex flex-col items-center p-2 font-mono",
              gameHistory[0].isWin ? "bg-green-900/30" : "bg-red-900/30", 
              pixelBorder
            )}>
              {/* Result label */}
              <div className="text-yellow-400 text-xs mb-1">PAYLINE RESULT:</div>
              
              {/* Middle row symbols - the ones that count for winning */}
              <div className="flex items-center justify-center mb-2">
                {gameHistory[0].symbols?.map((symbol, i) => (
                  <motion.div 
                    key={i} 
                    className={cn(
                      "text-3xl mx-1 py-1 px-2",
                      // Highlight pairs or triples
                      ((i > 0 && gameHistory[0].symbols && symbol === gameHistory[0].symbols[i-1]) ||
                       (i < 2 && gameHistory[0].symbols && symbol === gameHistory[0].symbols[i+1])) 
                        ? "bg-yellow-500/30 rounded" : ""
                    )}
                    initial={{ rotateY: 180, opacity: 0 }}
                    animate={{ rotateY: 0, opacity: 1 }}
                    transition={{ delay: i * 0.1, duration: 0.3 }}
                  >
                    {symbol}
                  </motion.div>
                ))}
              </div>
              
              <motion.div 
                className={cn(
                  "text-xl font-bold",
                  gameHistory[0].isWin ? "text-green-400" : "text-red-400"
                )}
                initial={{ scale: 0.5 }}
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ 
                  duration: 0.6, 
                  repeat: 3, 
                  repeatType: "reverse"
                }}
              >
                {gameHistory[0].isWin ? "+" : "-"}${Math.abs(gameHistory[0].amount)}
                {gameHistory[0].isWin && (
                  <motion.span 
                    className="ml-1 inline-block"
                    animate={{ rotate: [0, 15, -15, 0] }}
                    transition={{ duration: 0.5, repeat: Infinity, repeatType: "reverse" }}
                  >
                    🏆
                  </motion.span>
                )}
              </motion.div>
            </div>
            
            {/* Flashing border effect for wins */}
            {gameHistory[0].isWin && (
              <div className={cn(
                "absolute inset-0 border-2 border-yellow-400 pointer-events-none",
                "animate-pulse"
              )}></div>
            )}
          </div>
        </motion.div>
      )}
      
      {/* Game history display */}
      <div className={cn("mt-6 max-w-md w-full bg-indigo-900 p-4", pixelBorder)}>
        <h3 className="text-yellow-400 font-mono uppercase text-center mb-2">Game History</h3>
        
        {/* Stats bar */}
        <div className={cn("grid grid-cols-3 gap-2 mb-4", pixelBorder, "bg-black p-2")}>
          <div className="text-center">
            <div className="text-gray-400 font-mono text-xs">GAMES</div>
            <div className="text-white font-mono text-lg">{totalGames}</div>
          </div>
          <div className="text-center">
            <div className="text-gray-400 font-mono text-xs">WIN %</div>
            <div className={cn(
              "font-mono text-lg",
              winPercentage > 50 ? "text-green-400" : 
              winPercentage > 30 ? "text-yellow-400" : "text-red-400"
            )}>
              {winPercentage}%
            </div>
          </div>
          <div className="text-center">
            <div className="text-gray-400 font-mono text-xs">SESSION</div>
            <motion.div 
              className={cn(
                "font-mono text-lg",
                sessionBalance > 0 ? "text-green-400" : 
                sessionBalance < 0 ? "text-red-400" : "text-white"
              )}
              animate={{ scale: sessionBalance !== 0 ? [1, 1.1, 1] : 1 }}
              transition={{ duration: 0.5 }}
            >
              {sessionBalance > 0 ? '+' : ''}${Math.abs(sessionBalance)}
            </motion.div>
          </div>
        </div>
        
        {/* Streak indicator */}
        {currentStreak.count >= 2 && (
          <motion.div 
            className={cn(
              "relative mb-3 px-3 py-1 font-mono text-sm font-bold",
              currentStreak.type === 'win' ? "bg-green-600" : "bg-red-600",
              pixelBorder
            )}
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 500 }}
          >
            <div className="flex items-center justify-center">
              {currentStreak.type === 'win' ? (
                <>
                  <span className="mr-1">🔥</span>
                  <span className="mr-1">HOT STREAK:</span>
                  <span>{currentStreak.count} WINS IN A ROW!</span>
                  <span className="ml-1">🔥</span>
                </>
              ) : (
                <>
                  <span className="mr-1">❄️</span>
                  <span className="mr-1">COLD STREAK:</span>
                  <span>{currentStreak.count} LOSSES IN A ROW</span>
                  <span className="ml-1">❄️</span>
                </>
              )}
            </div>
            
            {/* Special sparkle effect for win streaks ≥ 3 */}
            {currentStreak.type === 'win' && currentStreak.count >= 3 && (
              <div className="absolute inset-0 pointer-events-none overflow-hidden">
                <div className="absolute top-0 left-0 w-2 h-2 bg-yellow-300 animate-ping"></div>
                <div className="absolute top-0 right-0 w-2 h-2 bg-yellow-300 animate-ping delay-100"></div>
                <div className="absolute bottom-0 left-0 w-2 h-2 bg-yellow-300 animate-ping delay-200"></div>
                <div className="absolute bottom-0 right-0 w-2 h-2 bg-yellow-300 animate-ping delay-300"></div>
              </div>
            )}
          </motion.div>
        )}
        
        <div className="grid grid-cols-1 gap-2">
          {gameHistory.length === 0 ? (
            <div className="text-gray-400 font-mono text-center text-sm">No games played yet</div>
          ) : (
            gameHistory.map((game, index) => (
              <motion.div 
                key={index} 
                className={cn(
                  "flex justify-between items-center px-2 py-1 font-mono text-sm",
                  index === 0 && showLastResult && "animate-pulse",
                  game.isWin ? "bg-green-900/40" : "bg-red-900/40",
                  pixelBorder
                )}
                initial={index === 0 ? { scale: 0.8, opacity: 0 } : { scale: 1, opacity: 1 }}
                animate={index === 0 ? { scale: 1, opacity: 1 } : { scale: 1, opacity: 1 }}
                transition={{ type: "spring", stiffness: 400, damping: 10 }}
              >
                <div className="flex items-center">
                  <span className="text-white mr-2">{`Game ${gameHistory.length - index}`}</span>
                  {game.symbols && (
                    <div className="flex">
                      {game.symbols.map((s, i) => (
                        <span key={i} className="text-xs mr-0.5">{s}</span>
                      ))}
                    </div>
                  )}
                </div>
                <div className={cn(
                  "flex items-center", 
                  game.isWin ? "text-green-400" : "text-red-400"
                )}>
                  {game.isWin ? "+" : "-"}${Math.abs(game.amount)}
                  {game.isWin && <span className="ml-1">🏆</span>}
                </div>
              </motion.div>
            ))
          )}
        </div>
      </div>
      
      {/* Arcade cabinet stand */}
      <div className={cn("w-32 h-8 bg-indigo-700 mt-4", pixelBorder)}></div>
      
      {/* Payout table */}
      <div className={cn("mt-4 max-w-md w-full bg-indigo-900 p-4", pixelBorder)}>
        <h3 className="text-yellow-400 font-mono uppercase text-center mb-2">Payout Table</h3>
        <div className="grid grid-cols-2 gap-2 text-sm font-mono">
          {Object.entries(PAYOUTS).map(([combo, multiplier]) => (
            <div key={combo} className="flex justify-between items-center">
              <span className="text-white">{combo === 'ANY_PAIR' ? 'Any Pair' : combo}</span>
              <span className="text-green-400">{multiplier}x</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
} 