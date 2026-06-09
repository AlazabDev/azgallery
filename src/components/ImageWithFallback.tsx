import { useState, type ImgHTMLAttributes } from 'react';
import logo from '../assets/logo-alazab.png';

export function ImageWithFallback({ src, alt, ...props }: ImgHTMLAttributes<HTMLImageElement>) {
  const [failed, setFailed] = useState(false);
  return <img {...props} src={failed || !src ? logo : src} alt={alt ?? ''} onError={() => setFailed(true)} />;
}
