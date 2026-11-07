import React, { useEffect, useState } from 'react';

interface AvatarProps {
  /** Image URL, or null to show the initials. */
  src: string | null;
  initials: string;
  /** Sizing/colour of the circle; the photo fills it. */
  className: string;
  textClassName?: string;
}

/** Photo when there is one and it loads; otherwise the initials. */
const Avatar: React.FC<AvatarProps> = ({ src, initials, className, textClassName }) => {
  const [failedSrc, setFailedSrc] = useState<string | null>(null);

  useEffect(() => {
    setFailedSrc(null);
  }, [src]);

  const showPhoto = src !== null && failedSrc !== src;

  return (
    <span className={`${className} overflow-hidden`}>
      {showPhoto ? (
        <img className="gd-avatar-img" src={src} alt="" onError={() => setFailedSrc(src)} />
      ) : (
        <span className={textClassName}>{initials}</span>
      )}
    </span>
  );
};

export default Avatar;
