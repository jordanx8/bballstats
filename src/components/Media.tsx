import React, { useState } from 'react';
import { getPlayerHeadshot, getTeamLogo } from '../services/media';

function initials(name: string, max = 2): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, max)
    .map(w => w[0]?.toUpperCase() ?? '')
    .join('');
}

interface TeamLogoProps {
  name: string;
  /** Pixel size of the (square) logo box. */
  size?: number;
  className?: string;
}

export const TeamLogo: React.FC<TeamLogoProps> = ({ name, size = 32, className = '' }) => {
  const src = getTeamLogo(name);
  const [failed, setFailed] = useState(false);
  const style = { width: size, height: size };

  if (!src || failed) {
    return (
      <div
        style={style}
        className={`shrink-0 rounded-full bg-[#1e2230] border border-[#2a2f42] text-[#b4bffd] flex items-center justify-center font-black ${className}`}
      >
        <span style={{ fontSize: Math.max(9, size * 0.34) }}>{initials(name)}</span>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={`${name} logo`}
      style={style}
      loading="lazy"
      onError={() => setFailed(true)}
      className={`shrink-0 object-contain ${className}`}
    />
  );
};

interface PlayerAvatarProps {
  name: string;
  size?: number;
  className?: string;
}

export const PlayerAvatar: React.FC<PlayerAvatarProps> = ({ name, size = 36, className = '' }) => {
  const src = getPlayerHeadshot(name);
  const [failed, setFailed] = useState(false);
  const style = { width: size, height: size };

  return (
    <div
      style={style}
      className={`shrink-0 rounded-full bg-[#1e2230] border border-[#2a2f42] overflow-hidden flex items-center justify-center ${className}`}
    >
      {src && !failed ? (
        <img
          src={src}
          alt={name}
          loading="lazy"
          onError={() => setFailed(true)}
          className="w-full h-full object-cover object-top"
        />
      ) : (
        <span className="font-black text-[#b4bffd]" style={{ fontSize: Math.max(9, size * 0.34) }}>
          {initials(name)}
        </span>
      )}
    </div>
  );
};
