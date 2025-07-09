/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  
  // Configuración de ESLint para reducir warnings
  eslint: {
    ignoreDuringBuilds: false,
    dirs: ['pages', 'components', 'lib']
  },
  
  // Configuración de imágenes externas
  images: {
    domains: ['cdn.myanimelist.net', 'example.com'],
    unoptimized: false,
  },
  
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'geolocation=(), microphone=()' },
          { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
          { 
            key: 'Content-Security-Policy', 
            value: "frame-src 'self' https://www.youtube.com https://youtube.com https://player.vimeo.com https://embed.videodelivery.net; media-src 'self' https://www.youtube.com https://youtube.com;" 
          },
        ],
      },
    ];
  },
  /**
   * Next.js detecta acceso desde una IP pública. Se recomienda declarar los orígenes permitidos.
   * allowedDevOrigins es opcional pero previene advertencias futuras.
   */
  allowedDevOrigins: ['http://3.137.206.7:3000'],
};

export default nextConfig;
