import Image from 'next/image';
import { useState } from 'react';

// Componente optimizado para imágenes externas
export default function OptimizedImage({ 
  src, 
  alt, 
  width = 200, 
  height = 300, 
  className = '', 
  style = {},
  priority = false,
  ...props 
}) {
  const [imageSrc, setImageSrc] = useState(src);
  const [imageError, setImageError] = useState(false);

  const handleError = () => {
    setImageError(true);
    // Fallback a imagen por defecto
    setImageSrc('/placeholder-image.png');
  };

  // Para imágenes de APIs externas (Jikan)
  if (src && src.includes('cdn.myanimelist.net')) {
    return (
      <Image
        src={imageSrc}
        alt={alt}
        width={width}
        height={height}
        className={className}
        style={style}
        priority={priority}
        onError={handleError}
        unoptimized // Para imágenes externas
        {...props}
      />
    );
  }

  // Para imágenes locales
  return (
    <Image
      src={imageSrc}
      alt={alt}
      width={width}
      height={height}
      className={className}
      style={style}
      priority={priority}
      onError={handleError}
      {...props}
    />
  );
}

// Componente simplificado para cuando no necesitamos todas las optimizaciones
export function SimpleImage({ src, alt, className, style, ...props }) {
  return (
    <img
      src={src}
      alt={alt}
      className={className}
      style={style}
      loading="lazy"
      {...props}
    />
  );
}
