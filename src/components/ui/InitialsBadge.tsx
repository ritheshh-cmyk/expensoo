import React from 'react';
import Tippy from '@tippyjs/react';
import 'tippy.js/dist/tippy.css';
import 'tippy.js/animations/scale.css';

const BADGE_COLOURS = [
  { bg: '#1D9E75', text: '#04342C' }, // teal
  { bg: '#378ADD', text: '#042C53' }, // blue
  { bg: '#7F77DD', text: '#26215C' }, // purple
  { bg: '#D85A30', text: '#4A1B0C' }, // coral
  { bg: '#EF9F27', text: '#412402' }, // amber
  { bg: '#D4537E', text: '#4B1528' }, // pink
];

function hashUserId(id: string): number {
  return id.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0) % 6;
}

export interface UserDetails {
  user_id: string;
  display_name: string;
}

interface InitialsBadgeProps {
  user: UserDetails | null | undefined;
}

export function InitialsBadge({ user }: InitialsBadgeProps) {
  if (!user || !user.user_id || !user.display_name) return null;

  const color = BADGE_COLOURS[hashUserId(user.user_id)];

  // Extract initials (up to 2 characters)
  const initials = user.display_name
    .split(' ')
    .filter((part) => part.trim().length > 0)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join('');

  const firstName = user.display_name.split(' ')[0];

  const tooltipContent = (
    <div className="px-1 py-0.5 text-center">
      <p className="text-xs font-semibold text-white">{user.display_name}</p>
      <p className="text-[10px] text-slate-300 mt-0.5">Created by</p>
    </div>
  );

  return (
    <div className="flex items-center gap-1.5 ml-auto">
      {/* Label: Hidden on mobile (<=640px), visible on desktop */}
      <span className="hidden sm:inline text-xs text-slate-400">by {firstName}</span>

      {/* Badge with Tippy tooltip */}
      <Tippy
        content={tooltipContent}
        animation="scale"
        placement="top"
        delay={[200, 0]}
      >
        <div
          className="flex items-center justify-center rounded-full text-[10px] font-bold tracking-wide cursor-default"
          style={{
            backgroundColor: color.bg,
            color: color.text,
            width: '24px',
            height: '24px',
            minWidth: '24px',
          }}
        >
          {initials}
        </div>
      </Tippy>
    </div>
  );
}
