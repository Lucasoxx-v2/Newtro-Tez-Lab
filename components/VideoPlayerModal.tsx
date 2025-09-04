import React, { useEffect } from 'react';

interface VideoPlayerModalProps {
  videoId: string;
  onClose: () => void;
}

const VideoPlayerModal: React.FC<VideoPlayerModalProps> = ({ videoId, onClose }) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 animate-fade-in"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-4xl aspect-video bg-black rounded-lg shadow-2xl mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        <iframe
          width="100%"
          height="100%"
          src={`https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0`}
          title="YouTube video player"
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="rounded-lg"
        ></iframe>
        <button
          onClick={onClose}
          className="absolute -top-3 -right-3 text-white bg-dark-secondary rounded-full p-1.5 hover:bg-accent hover:text-dark-primary transition-colors"
          aria-label="Close video player"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
};

export default VideoPlayerModal;
