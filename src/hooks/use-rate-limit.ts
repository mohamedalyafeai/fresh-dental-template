import { useState, useCallback } from 'react';

interface RateLimitConfig {
  maxAttempts: number;
  windowMs: number;
  lockoutMs: number;
}

interface RateLimitState {
  attempts: number;
  firstAttemptTime: number | null;
  lockedUntil: number | null;
}

const defaultConfig: RateLimitConfig = {
  maxAttempts: 5,
  windowMs: 15 * 60 * 1000, // 15 minutes
  lockoutMs: 30 * 60 * 1000, // 30 minutes lockout
};

export const useRateLimit = (key: string, config: Partial<RateLimitConfig> = {}) => {
  const finalConfig = { ...defaultConfig, ...config };
  
  const getStorageKey = () => `rate_limit_${key}`;
  
  const getState = (): RateLimitState => {
    try {
      const stored = localStorage.getItem(getStorageKey());
      if (stored) {
        return JSON.parse(stored);
      }
    } catch {
      // Ignore parse errors
    }
    return { attempts: 0, firstAttemptTime: null, lockedUntil: null };
  };
  
  const setState = (state: RateLimitState) => {
    localStorage.setItem(getStorageKey(), JSON.stringify(state));
  };
  
  const [, setTrigger] = useState(0);
  
  const checkRateLimit = useCallback((): { allowed: boolean; remainingAttempts: number; lockoutRemaining: number } => {
    const now = Date.now();
    const state = getState();
    
    // Check if currently locked out
    if (state.lockedUntil && now < state.lockedUntil) {
      return {
        allowed: false,
        remainingAttempts: 0,
        lockoutRemaining: Math.ceil((state.lockedUntil - now) / 1000 / 60),
      };
    }
    
    // Reset if lockout expired or window expired
    if (state.lockedUntil && now >= state.lockedUntil) {
      setState({ attempts: 0, firstAttemptTime: null, lockedUntil: null });
      return { allowed: true, remainingAttempts: finalConfig.maxAttempts, lockoutRemaining: 0 };
    }
    
    // Check if we're within the rate limit window
    if (state.firstAttemptTime && now - state.firstAttemptTime > finalConfig.windowMs) {
      setState({ attempts: 0, firstAttemptTime: null, lockedUntil: null });
      return { allowed: true, remainingAttempts: finalConfig.maxAttempts, lockoutRemaining: 0 };
    }
    
    const remainingAttempts = finalConfig.maxAttempts - state.attempts;
    return { allowed: remainingAttempts > 0, remainingAttempts, lockoutRemaining: 0 };
  }, [finalConfig.maxAttempts, finalConfig.windowMs]);
  
  const recordAttempt = useCallback(() => {
    const now = Date.now();
    const state = getState();
    
    // If locked, don't record
    if (state.lockedUntil && now < state.lockedUntil) {
      return;
    }
    
    const newAttempts = state.attempts + 1;
    const firstAttemptTime = state.firstAttemptTime ?? now;
    
    // Check if we should lock
    if (newAttempts >= finalConfig.maxAttempts) {
      setState({
        attempts: newAttempts,
        firstAttemptTime,
        lockedUntil: now + finalConfig.lockoutMs,
      });
    } else {
      setState({
        attempts: newAttempts,
        firstAttemptTime,
        lockedUntil: null,
      });
    }
    
    setTrigger(prev => prev + 1);
  }, [finalConfig.maxAttempts, finalConfig.lockoutMs]);
  
  const resetLimit = useCallback(() => {
    localStorage.removeItem(getStorageKey());
    setTrigger(prev => prev + 1);
  }, []);
  
  return { checkRateLimit, recordAttempt, resetLimit };
};
