import React, { useState, useEffect } from 'react';
import { getDefaultAvatar } from '../lib/avatarUtils';

interface AvatarProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  name: string;
}

export const Avatar: React.FC<AvatarProps> = ({ src, name, alt, className, referrerPolicy = "no-referrer", ...props }) => {
  const defaultSrc = getDefaultAvatar(name);
  const [imgSrc, setImgSrc] = useState(src || defaultSrc);

  useEffect(() => {
    setImgSrc(src || defaultSrc);
  }, [src, name]);

  const handleError = () => {
    if (imgSrc !== defaultSrc) {
      setImgSrc(defaultSrc);
    }
  };

  return (
    <img
      src={imgSrc || undefined}
      alt={alt || name}
      onError={handleError}
      className={className}
      referrerPolicy={referrerPolicy}
      {...props}
    />
  );
};
