// Minimalist Walking Route Directions Screen
// Hyper-minimalist pastel site analysis map with clean typography

import { useState } from 'react';
import { X, ArrowLeft, MapPin, Clock, ChevronRight } from 'lucide-react';

interface RoutePoint {
  id: string;
  name: string;
  landmark?: string;
  distance: string;
  time: string;
  iconColor: string;
}

interface MinimalistWalkingRouteProps {
  isOpen: boolean;
  onClose: () => void;
  startPoint?: string;
  points?: RoutePoint[];
  totalDistance?: string;
  totalTime?: string;
}

export function MinimalistWalkingRoute({
  isOpen,
  onClose,
  startPoint: _startPoint = 'MITS Campus Entrance',
  points,
  totalDistance = '450m',
  totalTime = '6 min'
}: MinimalistWalkingRouteProps) {
  const [activeIndex, setActiveIndex] = useState(0);

  const defaultPoints: RoutePoint[] = points ?? [
    {
      id: '1',
      name: 'MITS Canteen',
      landmark: 'Main building, ground floor',
      distance: '120m',
      time: '2 min',
      iconColor: '#F06A05'
    },
    {
      id: '2',
      name: 'MITS Cafe',
      landmark: 'Near library entrance',
      distance: '280m',
      time: '4 min',
      iconColor: '#EA580C'
    },
    {
      id: '3',
      name: 'MITS Hub',
      landmark: 'Food court area',
      distance: '450m',
      time: '6 min',
      iconColor: '#FEB252'
    }
  ];

  if (!isOpen) return null;

  return (
    <div className="rw-backdrop" onClick={onClose}>
      <div className="rw-sheet" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <header className="rw-header">
          <button
            type="button"
            className="rw-back-btn"
            onClick={() => setActiveIndex(0)}
            aria-label="Back to start"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="rw-title">Walking Route</h1>
            <p className="rw-distance">{totalDistance} • {totalTime} total</p>
          </div>
          <button
            type="button"
            className="rw-close-btn"
            onClick={onClose}
            aria-label="Close route"
          >
            <X size={20} />
          </button>
        </header>

        {/* Minimalist Site Analysis Map */}
        <div className="rw-map-container">
          <svg
            viewBox="0 0 320 200"
            className="rw-site-map"
            aria-hidden="true"
          >
            {/* Background - Pale Cream */}
            <rect width="320" height="200" fill="#FAF8F5" />

            {/* Major Roads - Muted Soft Sage Green Ribbons */}
            <path
              d="M40 40 L280 40 L280 160 L40 160 Z"
              fill="none"
              stroke="#C1D5C7"
              strokeWidth="12"
              strokeOpacity="0.6"
            />

            <path
              d="M80 80 L240 80 L240 120 L80 120 Z"
              fill="none"
              stroke="#B5C7B5"
              strokeWidth="8"
              strokeOpacity="0.5"
            />

            {/* Route Path - Thin Dark Dashed Line */}
            <defs>
              <pattern id="routePattern" x="0" y="0" width="8" height="8" patternUnits="userSpaceOnUse">
                <path d="M0 0 L6 6 M6 0 L0 6" stroke="#333333" strokeWidth="1.5" strokeOpacity="0.8" />
              </pattern>
            </defs>
            <polyline
              points="120,80 160,100 200,60 240,110"
              fill="none"
              stroke="url(#routePattern)"
              strokeWidth="2"
              strokeDasharray="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* Connection points between route segments */}
            <circle cx="120" cy="80" r="2" fill="#333333" />
            <circle cx="160" cy="100" r="2" fill="#333333" />
            <circle cx="200" cy="60" r="2" fill="#333333" />
            <circle cx="240" cy="110" r="2" fill="#333333" />
          </svg>

          {/* Map Pins positioned absolutely */}
          <div className="rw-pin rw-pin-start">
            <div className="rw-pin-ring" style={{ backgroundColor: '#F06A05' }}>
              <MapPin size={20} color="#FFFFFF" />
            </div>
          </div>

          <div className="rw-pin rw-pin-destination" style={{
            transform: 'translate(-50%, -100%)',
            top: '50%',
            left: '50%'
          }}>
            <div className="rw-pin-ring" style={{ backgroundColor: defaultPoints[activeIndex]?.iconColor ?? '#F06A05' }}>
              <MapPin size={20} color="#FFFFFF" />
            </div>
          </div>
        </div>

        {/* Route Steps */}
        <nav className="rw-steps" aria-label="Route directions">
          {defaultPoints.map((point, index) => (
            <button
              key={point.id}
              type="button"
              className={`rw-step ${index === activeIndex ? 'is-active' : ''}`}
              onClick={() => setActiveIndex(index)}
              aria-current={index === activeIndex ? 'true' : 'false'}
            >
              <div className="rw-step-indicator">
                <div
                  className="rw-step-dot"
                  style={{ backgroundColor: index === activeIndex ? '#F06A05' : '#C1D5C7' }}
                />
                {index < defaultPoints.length - 1 && (
                  <div
                    className="rw-step-line"
                    style={{ backgroundColor: index < activeIndex ? '#F06A05' : '#C1D5C7' }}
                  />
                )}
              </div>

              <div className="rw-step-content">
                <h3 className="rw-step-name">{point.name}</h3>
                <p className="rw-step-landmark">{point.landmark}</p>
              </div>

              <div className="rw-step-meta">
                <span className="rw-step-distance">{point.distance}</span>
                <span className="rw-step-time">{point.time}</span>
                <ChevronRight size={16} />
              </div>
            </button>
          ))}
        </nav>

        {/* Action Button */}
        <a
          href="https://www.google.com/maps/dir/?api=1&travelmode=walking&destination=MITS%20Campus"
          target="_blank"
          rel="noopener noreferrer"
          className="rw-action-btn"
          aria-label="Open full navigation in Google Maps"
        >
          <Clock size={18} />
          <span>Full walking directions</span>
        </a>
      </div>
    </div>
  );
}