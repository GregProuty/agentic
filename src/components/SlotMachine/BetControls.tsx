'use client';

import { motion } from 'framer-motion';
import React, { useState } from 'react';

import { useWallet } from './WalletContext';

interface BetControlsProps {
  disabled: boolean;
}

export default function BetControls({ disabled }: BetControlsProps) {
  const { balance, currentBet, increaseBet, decreaseBet } = useWallet();
  const [showResetModal, setShowResetModal] = useState(false);
  
  // Pixel art styling for buttons
  const pixelButton = "border-2 border-r-4 border-b-4 border-black font-mono uppercase text-white flex items-center justify-center";
  const disabledButtonStyle = "opacity-50 cursor-not-allowed";
  
  // Function to reset the player's balance
  const handleResetBalance = () => {
    // Use localStorage to reset the balance to default value
    if (typeof window !== 'undefined') {
      localStorage.setItem('pixel-slots-balance', '1000');
      // Reload the page to apply the change
      window.location.reload();
    }
    setShowResetModal(false);
  };
  
  // Check if the bet decrease button should be disabled
  const isDecreaseBetDisabled = disabled || currentBet <= 5;
  
  // Check if bet increase buttons should be disabled
  const isIncreaseBetDisabled = disabled || currentBet >= balance;
  
  // Check if specific bet increase buttons should be disabled
  const isBetAmountDisabled = (amount: number) => {
    return disabled || currentBet + amount > balance;
  };
  
  return (
    <>
      <div className="mt-4 bg-indigo-800 p-4 border-2 border-r-4 border-b-4 border-black">
        <div className="flex justify-between items-center mb-3">
          <div className="font-mono text-yellow-300 uppercase text-sm">
            Wallet: <span className={balance === 0 ? "text-red-400" : "text-green-400"}>${balance}</span>
          </div>
          <div className="font-mono text-yellow-300 uppercase text-sm">
            Bet: <span className="text-green-400">${currentBet}</span>
          </div>
          <motion.button
            className="bg-purple-700 text-white px-2 py-1 font-mono text-xs uppercase border-2 border-r-3 border-b-3 border-black"
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowResetModal(true)}
            disabled={disabled}
          >
            Reset
          </motion.button>
        </div>
        
        <div className="flex justify-between gap-2">
          {/* Decrease bet button */}
          <motion.button
            className={`${pixelButton} bg-red-600 px-4 py-2 w-1/3 ${isDecreaseBetDisabled ? disabledButtonStyle : ''}`}
            whileTap={!isDecreaseBetDisabled ? { scale: 0.95 } : {}}
            onClick={() => decreaseBet(5)}
            disabled={isDecreaseBetDisabled}
          >
            - 5
          </motion.button>
          
          {/* Bet amount display */}
          <div className="font-mono bg-black text-green-400 px-4 py-2 flex-1 text-center border-2 border-r-4 border-b-4 border-black">
            ${currentBet}
          </div>
          
          {/* Increase bet button */}
          <motion.button
            className={`${pixelButton} bg-green-600 px-4 py-2 w-1/3 ${isIncreaseBetDisabled ? disabledButtonStyle : ''}`}
            whileTap={!isIncreaseBetDisabled ? { scale: 0.95 } : {}}
            onClick={() => increaseBet(5)}
            disabled={isIncreaseBetDisabled}
          >
            + 5
          </motion.button>
        </div>
        
        <div className="grid grid-cols-3 gap-2 mt-2">
          {[10, 25, 50].map((amount) => (
            <motion.button
              key={amount}
              className={`${pixelButton} bg-blue-600 py-1 ${isBetAmountDisabled(amount) ? disabledButtonStyle : ''}`}
              whileTap={!isBetAmountDisabled(amount) ? { scale: 0.95 } : {}}
              onClick={() => increaseBet(amount)}
              disabled={isBetAmountDisabled(amount)}
            >
              +{amount}
            </motion.button>
          ))}
        </div>
        
        <div className="flex justify-between mt-2">
          <motion.button
            className={`${pixelButton} bg-purple-600 py-1 px-2 ${isDecreaseBetDisabled ? disabledButtonStyle : ''}`}
            whileTap={!isDecreaseBetDisabled ? { scale: 0.95 } : {}}
            onClick={() => decreaseBet(currentBet - 5)}
            disabled={isDecreaseBetDisabled}
          >
            MIN
          </motion.button>
          
          <motion.button
            className={`${pixelButton} bg-purple-600 py-1 px-2 ${isIncreaseBetDisabled ? disabledButtonStyle : ''}`}
            whileTap={!isIncreaseBetDisabled ? { scale: 0.95 } : {}}
            onClick={() => increaseBet(balance - currentBet)}
            disabled={isIncreaseBetDisabled}
          >
            MAX
          </motion.button>
        </div>
        
        {balance === 0 && (
          <div className="bg-red-800 text-white text-center py-2 mt-4 font-mono text-sm animate-pulse border border-red-600">
            YOU'RE OUT OF FUNDS! RESET YOUR BALANCE
          </div>
        )}
      </div>
      
      {/* Reset balance confirmation modal */}
      {showResetModal && (
        <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-4">
          <div className="bg-indigo-900 p-6 max-w-sm border-2 border-r-4 border-b-4 border-black">
            <h3 className="text-xl font-mono text-yellow-400 mb-4 uppercase text-center">Reset Balance?</h3>
            <p className="text-white font-mono mb-6">
              This will reset your wallet to $1000. Are you sure?
            </p>
            <div className="flex justify-between gap-4">
              <motion.button
                className={`${pixelButton} bg-red-600 py-2 px-4 flex-1`}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowResetModal(false)}
              >
                No
              </motion.button>
              <motion.button
                className={`${pixelButton} bg-green-600 py-2 px-4 flex-1`}
                whileTap={{ scale: 0.95 }}
                onClick={handleResetBalance}
              >
                Yes
              </motion.button>
            </div>
          </div>
        </div>
      )}
    </>
  );
} 