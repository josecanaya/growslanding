'use client';

import { useState } from 'react';
import { Calendar, ChevronLeft, ChevronRight, Clock, MapPin } from 'lucide-react';

interface User {
  name: string;
  avatar: string;
  rating: number;
  level: string;
}

interface CalendarioProps {
  user: User;
}

interface CalendarEvent {
  id: number;
  title: string;
  date: string;
  time: string;
  location: string;
  type: 'obra' | 'reunion' | 'entrega' | 'otro';
}

export function Calendario({ user }: CalendarioProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  
  const events: CalendarEvent[] = [
    {
      id: 1,
      title: 'Replanteo de cimientos - Casa Familiar',
      date: '2024-01-20',
      time: '08:00',
      location: 'San Isidro, Buenos Aires',
      type: 'obra'
    },
    {
      id: 2,
      title: 'Reunión con cliente - Edificio Residencial',
      date: '2024-01-22',
      time: '14:00',
      location: 'Palermo, Buenos Aires',
      type: 'reunion'
    },
    {
      id: 3,
      title: 'Entrega de estructura - Casa Familiar',
      date: '2024-01-25',
      time: '16:00',
      location: 'San Isidro, Buenos Aires',
      type: 'entrega'
    },
    {
      id: 4,
      title: 'Inicio de obra - Edificio Residencial',
      date: '2024-01-28',
      time: '07:00',
      location: 'Palermo, Buenos Aires',
      type: 'obra'
    }
  ];

  const getEventTypeColor = (type: string) => {
    switch (type) {
      case 'obra': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'reunion': return 'bg-green-100 text-green-800 border-green-200';
      case 'entrega': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'otro': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getEventTypeIcon = (type: string) => {
    switch (type) {
      case 'obra': return '🏗️';
      case 'reunion': return '👥';
      case 'entrega': return '📦';
      case 'otro': return '📅';
      default: return '📅';
    }
  };

  const generateCalendarDays = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());
    
    const days = [];
    const today = new Date();
    
    for (let i = 0; i < 42; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);
      
      const dayEvents = events.filter(event => {
        const eventDate = new Date(event.date);
        return eventDate.toDateString() === date.toDateString();
      });
      
      days.push({
        date,
        isCurrentMonth: date.getMonth() === month,
        isToday: date.toDateString() === today.toDateString(),
        events: dayEvents
      });
    }
    
    return days;
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    if (direction === 'prev') {
      newDate.setMonth(newDate.getMonth() - 1);
    } else {
      newDate.setMonth(newDate.getMonth() + 1);
    }
    setCurrentDate(newDate);
  };

  const monthNames = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  const weekDays = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

  const calendarDays = generateCalendarDays();

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-dark">Calendario</h2>
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigateMonth('prev')}
            className="p-2 hover:bg-light rounded-lg transition-colors duration-200"
          >
            <ChevronLeft className="h-5 w-5 text-dark" />
          </button>
          <h3 className="text-lg font-semibold text-dark">
            {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
          </h3>
          <button
            onClick={() => navigateMonth('next')}
            className="p-2 hover:bg-light rounded-lg transition-colors duration-200"
          >
            <ChevronRight className="h-5 w-5 text-dark" />
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        {/* Header de días de la semana */}
        <div className="grid grid-cols-7 bg-light border-b">
          {weekDays.map((day) => (
            <div key={day} className="p-3 text-center font-medium text-dark/70 text-sm">
              {day}
            </div>
          ))}
        </div>

        {/* Grid del calendario */}
        <div className="grid grid-cols-7">
          {calendarDays.map((day, index) => (
            <div
              key={index}
              className={`
                min-h-[120px] p-2 border-r border-b border-light
                ${day.isCurrentMonth ? 'bg-white' : 'bg-light/50'}
                ${day.isToday ? 'bg-accent/20' : ''}
              `}
            >
              <div className={`
                text-sm font-medium mb-1
                ${day.isCurrentMonth ? 'text-dark' : 'text-dark/50'}
                ${day.isToday ? 'text-primary font-bold' : ''}
              `}>
                {day.date.getDate()}
              </div>
              
              <div className="space-y-1">
                {day.events.slice(0, 2).map((event) => (
                  <div
                    key={event.id}
                    className={`
                      text-xs p-1 rounded border
                      ${getEventTypeColor(event.type)}
                    `}
                  >
                    <div className="flex items-center space-x-1">
                      <span>{getEventTypeIcon(event.type)}</span>
                      <span className="truncate">{event.title}</span>
                    </div>
                  </div>
                ))}
                {day.events.length > 2 && (
                  <div className="text-xs text-dark/50">
                    +{day.events.length - 2} más
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Lista de eventos próximos */}
      <div className="mt-6">
        <h3 className="text-lg font-semibold text-dark mb-4">Próximos eventos</h3>
        <div className="space-y-3">
          {events.slice(0, 4).map((event) => (
            <div key={event.id} className="bg-light rounded-lg p-4 hover:shadow-md transition-shadow duration-200">
              <div className="flex items-start space-x-3">
                <div className="text-2xl">{getEventTypeIcon(event.type)}</div>
                <div className="flex-1">
                  <h4 className="font-medium text-dark">{event.title}</h4>
                  <div className="flex items-center space-x-4 mt-1 text-sm text-dark/70">
                    <div className="flex items-center space-x-1">
                      <Calendar className="h-4 w-4" />
                      <span>{event.date}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Clock className="h-4 w-4" />
                      <span>{event.time}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <MapPin className="h-4 w-4" />
                      <span>{event.location}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
