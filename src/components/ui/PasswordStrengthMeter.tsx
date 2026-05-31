import React from 'react';

interface Props {
  password: string;
}

function getStrength(password: string): { score: number; label: string; color: string; tips: string[] } {
  let score = 0;
  const tips: string[] = [];

  if (password.length >= 8) score++; else tips.push('At least 8 characters');
  if (password.length >= 12) score++;
  if (/[A-Z]/.test(password)) score++; else tips.push('Add uppercase letters');
  if (/[0-9]/.test(password)) score++; else tips.push('Add at least one number');
  if (/[^A-Za-z0-9]/.test(password)) score++; else tips.push('Add a special character (!@#$%)');

  const labels = ['Very Weak', 'Weak', 'Fair', 'Strong', 'Very Strong', 'Excellent'];
  const colors = ['bg-red-500', 'bg-red-400', 'bg-yellow-400', 'bg-blue-400', 'bg-green-400', 'bg-green-600'];

  return { score, label: labels[score] ?? 'Excellent', color: colors[score] ?? 'bg-green-600', tips };
}

export function PasswordStrengthMeter({ password }: Props) {
  if (!password) return null;
  const { score, label, color, tips } = getStrength(password);

  return (
    <div className="space-y-2 mt-2">
      <div className="flex gap-1">
        {[0, 1, 2, 3, 4].map(i => (
          <div
            key={i}
            className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${i < score ? color : 'bg-muted'}`}
          />
        ))}
      </div>
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">{label}</span>
        {score < 4 && tips.length > 0 && (
          <span className="text-xs text-muted-foreground">{tips[0]}</span>
        )}
      </div>
    </div>
  );
}

/**
 * Returns an error string if the password fails complexity requirements,
 * or null if it's valid.
 */
export function validatePassword(password: string): string | null {
  if (password.length < 8) return 'Password must be at least 8 characters';
  if (!/[0-9]/.test(password)) return 'Password must contain at least one number';
  if (!/[^A-Za-z0-9]/.test(password)) return 'Password must contain at least one special character (!@#$%)';
  return null; // valid
}
