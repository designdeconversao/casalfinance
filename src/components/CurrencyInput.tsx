'use client';

import { useState, useEffect, useRef } from 'react';

interface CurrencyInputProps {
  value: string;
  onChange: (rawCents: string) => void;
  placeholder?: string;
  required?: boolean;
  className?: string;
  id?: string;
}

/**
 * Smart currency input for BRL.
 * Typing starts from the right with the comma auto-placed.
 * Example: user types 1 → 0,01 → types 5 → 0,15 → types 0 → 1,50 → types 0 → 15,00
 * The `value` prop should be the raw numeric string (e.g. "1500" for R$ 15,00).
 * The `onChange` callback receives the raw cents string.
 */
export default function CurrencyInput({ value, onChange, placeholder = 'R$ 0,00', required, className, id }: CurrencyInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  
  // Convert raw cents string to display format
  const formatDisplay = (rawCents: string): string => {
    const cents = parseInt(rawCents || '0', 10);
    if (cents === 0) return '';
    
    const reais = Math.floor(cents / 100);
    const centavos = cents % 100;
    
    // Format with thousand separators
    const reaisStr = reais.toLocaleString('pt-BR');
    const centavosStr = centavos.toString().padStart(2, '0');
    
    return `R$ ${reaisStr},${centavosStr}`;
  };

  // Get the numeric value in reais (for API submission)
  const getReaisValue = (rawCents: string): string => {
    const cents = parseInt(rawCents || '0', 10);
    return (cents / 100).toFixed(2);
  };

  const [displayValue, setDisplayValue] = useState(formatDisplay(value));

  useEffect(() => {
    setDisplayValue(formatDisplay(value));
  }, [value]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Allow: backspace, delete, tab, escape, enter
    if (['Backspace', 'Delete', 'Tab', 'Escape', 'Enter'].includes(e.key)) {
      if (e.key === 'Backspace') {
        e.preventDefault();
        // Remove last digit
        const currentCents = value || '0';
        const newCents = currentCents.slice(0, -1) || '0';
        onChange(newCents);
      }
      return;
    }

    // Only allow digits
    if (!/^[0-9]$/.test(e.key)) {
      e.preventDefault();
      return;
    }

    e.preventDefault();
    
    // Append digit to the right
    const currentCents = value || '0';
    const newCents = currentCents === '0' ? e.key : currentCents + e.key;
    
    // Limit to prevent absurdly large numbers (max 999.999.999,99)
    if (parseInt(newCents, 10) > 99999999999) return;
    
    onChange(newCents);
  };

  const handleFocus = () => {
    // Place cursor at end
    if (inputRef.current) {
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.setSelectionRange(
            inputRef.current.value.length,
            inputRef.current.value.length
          );
        }
      }, 0);
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedText = e.clipboardData.getData('text');
    // Extract only digits from pasted text
    const digits = pastedText.replace(/\D/g, '');
    if (digits) {
      onChange(digits);
    }
  };

  return (
    <input
      ref={inputRef}
      id={id}
      type="text"
      inputMode="numeric"
      className={className || 'form-input'}
      placeholder={placeholder}
      value={displayValue}
      onKeyDown={handleKeyDown}
      onFocus={handleFocus}
      onPaste={handlePaste}
      onChange={() => {}} // Controlled by keyDown
      required={required}
      autoComplete="off"
      style={{ textAlign: 'right', fontSize: 16, letterSpacing: '0.5px' }}
    />
  );
}

// Helper to convert raw cents to number for API
export function centsToReais(rawCents: string): number {
  return parseInt(rawCents || '0', 10) / 100;
}

// Helper to convert reais number to raw cents string
export function reaisToCents(reais: number): string {
  return Math.round(reais * 100).toString();
}
