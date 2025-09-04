import React from 'react';

const generateId = (text: string) => {
  return text.toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^\w-]+/g, '')
    .replace(/--+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '');
};

const MarkdownRenderer: React.FC<{ content: string }> = ({ content }) => {
  const lines = content.trim().split('\n');

  return (
    <div>
      {lines.map((line, index) => {
        const trimmedLine = line.trim();

        if (trimmedLine.startsWith('### ')) {
          const text = trimmedLine.substring(4);
          return <h3 key={index} id={generateId(text)} className="text-xl font-bold text-white mt-4 mb-2 scroll-mt-20">{text}</h3>;
        }

        if (trimmedLine.startsWith('## ')) {
          const text = trimmedLine.substring(3);
          return <h2 key={index} id={generateId(text)} className="text-2xl font-bold text-accent mt-6 mb-3 scroll-mt-20">{text}</h2>;
        }
        
        if (trimmedLine.startsWith('youtube:')) {
          const videoId = trimmedLine.substring(8);
          return (
            <div key={index} className="my-6 aspect-video">
              <iframe
                width="100%"
                height="100%"
                src={`https://www.youtube.com/embed/${videoId}?rel=0`}
                title="YouTube video player"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="rounded-lg shadow-lg"
              ></iframe>
            </div>
          );
        }

        if (trimmedLine.startsWith('tweet:')) {
          const url = trimmedLine.substring(6);
          return (
            <div key={index} className="my-6 p-4 border border-gray-700 rounded-lg bg-dark-secondary max-w-lg mx-auto shadow-md text-center">
              <a href={url} target="_blank" rel="noopener noreferrer" className="text-accent hover:underline font-semibold">
                View Post on X &rarr;
              </a>
            </div>
          );
        }
        
        if (trimmedLine === '') {
          return null;
        }

        // Basic link handling for lines that are just a URL
        if (trimmedLine.startsWith('http')) {
          return (
            <p key={index} className="text-gray-300 leading-relaxed mb-4">
              <a href={trimmedLine} target="_blank" rel="noopener noreferrer" className="text-accent hover:underline break-all">
                {trimmedLine}
              </a>
            </p>
          )
        }

        return <p key={index} className="text-gray-300 leading-relaxed mb-4">{trimmedLine}</p>;
      })}
    </div>
  );
};

export default MarkdownRenderer;