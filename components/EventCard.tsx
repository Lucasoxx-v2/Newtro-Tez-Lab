import React from 'react';
import type { Event } from '../types';

interface EventCardProps {
  event: Event;
  onSelect: () => void;
}

const EventCard: React.FC<EventCardProps> = ({ event, onSelect }) => {
  return (
    <div 
      onClick={onSelect}
      className="bg-dark-secondary rounded-lg overflow-hidden border border-gray-700 group transition-all duration-300 hover:border-accent hover:shadow-lg hover:shadow-accent/5 hover:-translate-y-1 cursor-pointer flex flex-col"
    >
      <div className="aspect-video overflow-hidden">
        <img src={event.imageUrl} alt={event.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
      </div>
      <div className="p-4 flex flex-col flex-grow">
        <p className="text-xs text-gray-400 mb-1">{event.date}</p>
        <h3 className="text-lg font-bold text-white mb-2 truncate">{event.title}</h3>
        <p className="text-sm text-gray-300 line-clamp-3 flex-grow">{event.summary}</p>
      </div>
    </div>
  );
};

export default EventCard;
