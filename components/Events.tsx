import React, { useState, useRef, useEffect, useLayoutEffect } from 'react';
import { eventsData } from '../data/eventsData';
import EventCard from './EventCard';
import EventDetail from './EventDetail';
import type { Event } from '../types';
import { Button } from './ui/Button';

const Events: React.FC = () => {
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const sectionRef = useRef<HTMLElement>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const gridWrapperRef = useRef<HTMLDivElement>(null);
  const detailWrapperRef = useRef<HTMLDivElement>(null);

  const [viewHeight, setViewHeight] = useState<number | 'auto'>('auto');

  const handleSelectEvent = (eventId: string) => {
    const event = eventsData.find(e => e.id === eventId);
    if (event) {
      setSelectedEvent(event);
    }
  };

  const handleGoBack = () => {
    setSelectedEvent(null);
  };
  
  useLayoutEffect(() => {
      if (selectedEvent && detailWrapperRef.current) {
        setViewHeight(detailWrapperRef.current.scrollHeight);
      } else if (!selectedEvent && gridWrapperRef.current) {
        setViewHeight(gridWrapperRef.current.scrollHeight);
      }
  }, [selectedEvent]);


  useEffect(() => {
    if (selectedEvent && sectionRef.current) {
      sectionRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [selectedEvent]);

  return (
    <section ref={sectionRef}>
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-white tracking-tight sm:text-4xl">Events and memories</h2>
        <p className="mt-2 text-lg text-gray-400">A chronicle of the Newtro Collective's journey.</p>
      </div>
      
      <div 
        ref={containerRef}
        className="relative transition-[height] duration-500 ease-in-out"
        style={{ height: viewHeight }}
      >
        <div 
          ref={gridWrapperRef}
          className={`transition-opacity duration-300 ${selectedEvent ? 'opacity-0' : 'opacity-100'}`}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {eventsData.map(event => (
              <EventCard 
                key={event.id}
                event={event} 
                onSelect={() => handleSelectEvent(event.id)} 
              />
            ))}
          </div>
        </div>

        <div
            ref={detailWrapperRef}
            className={`absolute top-0 left-0 w-full transition-opacity duration-300 ${selectedEvent ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        >
            {selectedEvent && (
                <>
                    <Button 
                        onClick={handleGoBack}
                        className="mb-6 bg-dark-secondary border border-gray-700 text-gray-300 hover:text-white hover:border-accent"
                    >
                        &larr; Back to All Events
                    </Button>
                    <div className="bg-dark-secondary p-1 rounded-lg border-2 border-accent shadow-2xl shadow-accent/10">
                        <EventDetail event={selectedEvent} />
                    </div>
                </>
            )}
        </div>
      </div>
    </section>
  );
};

export default Events;
