"use client";

import { useState, useEffect, useCallback } from "react";
import { generateTOTP, formatCode, getRemainingSeconds } from "@/lib/totp";
import type { TOTPToken } from "@/types/vault";

interface UseTotpReturn {
  code: string;
  rawCode: string;
  remainingSeconds: number;
  period: number;
  progress: number;
}

export function useTotp(token: TOTPToken): UseTotpReturn {
  const [rawCode, setRawCode] = useState<string>("------");
  const [remainingSeconds, setRemainingSeconds] = useState<number>(
    getRemainingSeconds(token.period)
  );

  const generate = useCallback(async () => {
    try {
      const code = await generateTOTP(token.secret, {
        algorithm: token.algorithm,
        digits: token.digits,
        period: token.period,
      });
      setRawCode(code);
    } catch {
      setRawCode("-".repeat(token.digits));
    }
  }, [token.secret, token.algorithm, token.digits, token.period]);

  useEffect(() => {
    // Generate immediately on mount
    generate();

    const interval = setInterval(() => {
      const remaining = getRemainingSeconds(token.period);
      setRemainingSeconds(remaining);

      // When the period flips (remaining resets to period), regenerate
      if (remaining === token.period) {
        generate();
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [generate, token.period]);

  const code = formatCode(rawCode);
  const progress = remainingSeconds / token.period;

  return {
    code,
    rawCode,
    remainingSeconds,
    period: token.period,
    progress,
  };
}
