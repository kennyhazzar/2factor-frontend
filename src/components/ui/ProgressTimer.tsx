"use client";

interface ProgressTimerProps {
  remainingSeconds: number;
  period: number;
}

export function ProgressTimer({ remainingSeconds, period }: ProgressTimerProps) {
  const progress = remainingSeconds / period;
  const isWarning = remainingSeconds <= 5;

  // SVG circle parameters
  const size = 40;
  const strokeWidth = 3;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - progress);

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="rotate-[-90deg]"
      >
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-muted/30"
        />
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className={`transition-all duration-1000 linear ${
            isWarning ? "text-destructive" : "text-primary"
          }`}
        />
      </svg>
      {/* Remaining seconds text */}
      <span
        className={`absolute text-xs font-medium ${
          isWarning ? "text-destructive" : "text-muted-foreground"
        }`}
      >
        {remainingSeconds}
      </span>
    </div>
  );
}
