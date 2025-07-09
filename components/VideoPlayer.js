import { useState, useEffect } from 'react';

const VideoPlayer = ({ video, index, openVideo, setOpenVideo }) => {
  const [videoError, setVideoError] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleVideoClick = () => {
    if (openVideo === index) {
      setOpenVideo(null);
    } else {
      setIsLoading(true);
      setVideoError(false);
      setOpenVideo(index);
    }
  };

  const handleIframeLoad = () => {
    setIsLoading(false);
  };

  const handleIframeError = () => {
    setVideoError(true);
    setIsLoading(false);
  };

  // Convertir URL de YouTube a embed si es necesario
  const getEmbedUrl = (url) => {
    if (!url) return null;
    
    // Si ya es una URL de embed, devolverla tal como está
    if (url.includes('youtube.com/embed/') || url.includes('youtu.be/embed/')) {
      return url;
    }
    
    // Convertir URLs de YouTube regulares a embed
    const youtubeRegex = /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
    const match = url.match(youtubeRegex);
    
    if (match) {
      return `https://www.youtube.com/embed/${match[1]}?enablejsapi=1&origin=${window.location.origin}`;
    }
    
    return url;
  };

  const embedUrl = getEmbedUrl(video.trailer?.embed_url);
  const directUrl = video.trailer?.url;

  return (
    <div 
      key={index} 
      style={{ 
        flex: '1 1 320px', 
        maxWidth: 480, 
        background: '#fff', 
        borderRadius: 16, 
        boxShadow: '0 2px 12px #b71c1c22', 
        padding: 18, 
        border: '2px solid #eabf9f', 
        boxSizing: 'border-box', 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center' 
      }}
    >
      <b style={{ fontSize: 18, textAlign: 'center', marginBottom: 16 }}>{video.title}</b>
      
      {openVideo === index && embedUrl && !videoError ? (
        <div style={{ margin: '16px 0', width: '100%' }}>
          {isLoading && (
            <div style={{ 
              width: '100%', 
              height: 300, 
              background: '#f5f5f5', 
              borderRadius: 12, 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              border: '2px solid #eabf9f' 
            }}>
              <span style={{ color: '#666', fontSize: 16 }}>Cargando video...</span>
            </div>
          )}
          <iframe
            src={embedUrl}
            title={video.title}
            width="100%"
            height="300"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            style={{ 
              borderRadius: 12, 
              border: '2px solid #eabf9f', 
              background: '#000',
              display: isLoading ? 'none' : 'block'
            }}
            onLoad={handleIframeLoad}
            onError={handleIframeError}
          />
          <div style={{ marginTop: 10, textAlign: 'center' }}>
            <button 
              onClick={() => setOpenVideo(null)}
              style={{ 
                padding: '0.5rem 1rem', 
                fontSize: 14, 
                borderRadius: 8, 
                background: '#b71c1c', 
                color: '#fff', 
                border: 'none', 
                cursor: 'pointer',
                marginRight: 10
              }}
            >
              Cerrar video
            </button>
            {directUrl && (
              <a 
                href={directUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                style={{ 
                  padding: '0.5rem 1rem', 
                  fontSize: 14, 
                  borderRadius: 8, 
                  background: '#eabf9f', 
                  color: '#b71c1c', 
                  textDecoration: 'none', 
                  display: 'inline-block' 
                }}
              >
                Ver en YouTube
              </a>
            )}
          </div>
        </div>
      ) : (
        <div style={{ margin: '16px 0', display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
          {video.trailer && video.trailer.images && video.trailer.images.maximum ? (
            <img 
              src={video.trailer.images.maximum} 
              alt={video.title} 
              style={{ 
                width: '100%', 
                maxHeight: 220, 
                objectFit: 'cover', 
                borderRadius: 10, 
                marginBottom: 10, 
                cursor: 'pointer', 
                border: '2px solid #eabf9f', 
                boxShadow: '0 2px 8px #b71c1c22' 
              }} 
              onClick={handleVideoClick}
            />
          ) : (
            <div style={{ 
              width: '100%', 
              height: 220, 
              background: '#f5f5f5', 
              borderRadius: 10, 
              marginBottom: 10, 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              border: '2px solid #eabf9f',
              cursor: 'pointer'
            }}
            onClick={handleVideoClick}
            >
              <span style={{ color: '#666', fontSize: 48 }}>🎬</span>
            </div>
          )}
          
          {videoError && (
            <div style={{ 
              marginBottom: 10, 
              padding: '8px 12px', 
              background: '#ffebee', 
              color: '#c62828', 
              borderRadius: 8, 
              fontSize: 14,
              textAlign: 'center'
            }}>
              Error al cargar el video
            </div>
          )}
          
          <button 
            style={{ 
              padding: '0.7rem 2rem', 
              fontSize: 18, 
              borderRadius: 10, 
              background: '#eabf9f', 
              color: '#b71c1c', 
              border: 'none', 
              cursor: 'pointer', 
              fontWeight: 700, 
              marginBottom: 10 
            }} 
            onClick={handleVideoClick}
          >
            {openVideo === index ? 'Cerrar video' : 'Ver video'}
          </button>
          
          {directUrl && (
            <a 
              href={directUrl} 
              target="_blank" 
              rel="noopener noreferrer"
              style={{ 
                padding: '0.5rem 1rem', 
                fontSize: 14, 
                borderRadius: 8, 
                background: '#b71c1c', 
                color: '#fff', 
                textDecoration: 'none', 
                display: 'inline-block' 
              }}
            >
              Ver directo en YouTube
            </a>
          )}
        </div>
      )}
    </div>
  );
};

export default VideoPlayer;
