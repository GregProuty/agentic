'use client';

import React, { createContext, ReactNode,useContext, useEffect, useState } from 'react';

// Define the wallet context type
interface WalletContextType {
  balance: number;
  currentBet: number;
  setCurrentBet: (bet: number) => void;
  increaseBet: (amount: number) => void;
  decreaseBet: (amount: number) => void;
  placeBet: () => boolean;
  addToBalance: (amount: number) => void;
}

// Create context with default values
const WalletContext = createContext<WalletContextType>({
  balance: 1000, // Default starting balance
  currentBet: 10, // Default bet amount
  setCurrentBet: () => { /* no-op */ },
  increaseBet: () => { /* no-op */ },
  decreaseBet: () => { /* no-op */ },
  placeBet: () => false,
  addToBalance: () => { /* no-op */ },
});

// Hook to use the wallet context
export const useWallet = () => useContext(WalletContext);

// Provider component
export function WalletProvider({ children }: { children: ReactNode }) {
  // Local storage keys
  const BALANCE_KEY = 'pixel-slots-balance';
  const BET_KEY = 'pixel-slots-bet';
  
  // Initialize state from localStorage if available, otherwise use defaults
  const [balance, setBalance] = useState<number>(1000);
  const [currentBet, setCurrentBet] = useState<number>(10);
  
  // Load saved values from localStorage on initial render
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedBalance = localStorage.getItem(BALANCE_KEY);
      const savedBet = localStorage.getItem(BET_KEY);
      
      if (savedBalance) {
        setBalance(parseInt(savedBalance));
      }
      
      if (savedBet) {
        setCurrentBet(parseInt(savedBet));
      }
    }
  }, []);
  
  // Save values to localStorage when they change
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(BALANCE_KEY, balance.toString());
      localStorage.setItem(BET_KEY, currentBet.toString());
    }
  }, [balance, currentBet]);
  
  // Increase bet amount
  const increaseBet = (amount: number) => {
    // Don't allow betting more than balance
    if (currentBet + amount <= balance) {
      setCurrentBet(prev => prev + amount);
    } else {
      // Set bet to maximum available
      setCurrentBet(balance);
    }
  };
  
  // Decrease bet amount
  const decreaseBet = (amount: number) => {
    // Don't allow bets lower than minimum
    const MIN_BET = 5;
    if (currentBet - amount >= MIN_BET) {
      setCurrentBet(prev => prev - amount);
    } else {
      // Set to minimum bet
      setCurrentBet(MIN_BET);
    }
  };
  
  // Place a bet and return whether it was successful
  const placeBet = (): boolean => {
    // Check if player has enough balance
    if (balance >= currentBet && currentBet > 0) {
      setBalance(prev => prev - currentBet);
      return true;
    }
    return false;
  };
  
  // Add winnings to balance
  const addToBalance = (amount: number) => {
    setBalance(prev => prev + amount);
  };
  
  // Create the context value object
  const value = {
    balance,
    currentBet,
    setCurrentBet,
    increaseBet,
    decreaseBet,
    placeBet,
    addToBalance,
  };
  
  return (
    <WalletContext.Provider value={value}>
      {children}
    </WalletContext.Provider>
  );
} 