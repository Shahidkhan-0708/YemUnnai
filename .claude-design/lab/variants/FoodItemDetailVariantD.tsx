// Food Item Detail - Variant D: Interaction Model
// Bottom sheet drawer pattern - progressive disclosure with contextual actions
// Toing/Swiggy inspired: expandable sections, quick-add from summary, swipe gestures

import { useState } from 'react';
import { MOCK_FOOD_ITEMS, MOCK_VENDORS } from '../data/fixtures';

const item = MOCK_FOOD_ITEMS[0];
const vendor = MOCK_VENDORS.find(v => v.id === item.vendorId)!;
const dietary = item.dietary;

type PortionSize = { name: string; price: number };

export function FoodItemDetailVariantD() {
  const [quantity, setQuantity] = useState(1);
  const [selectedPortion, setSelectedPortion] = useState<PortionSize | undefined>(item.portionSizes?.[0]);
  const [isSaved, setIsSaved] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    description: true,
    nutrition: false,
    allergens: false,
    reviews: false
  });
  const [showFullDescription, setShowFullDescription] = useState(false);

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  return (
    <div className="detail-screen" style={{ minHeight: '812px', width: '375px', margin: '0 auto', background: '#E8ECEF', position: 'relative', fontFamily: 'Plus Jakarta Sans, system-ui, sans-serif' }}>
      {/* Sticky Hero with Quick Actions */}
      <div className="detail-hero" style={{
        position: 'sticky',
        top: 0,
        zIndex: 20,
        height: '220px',
        background: dietary === 'veg' ? '#E6F5ED' : dietary === 'nonveg' ? '#FCEAE4' : '#F5F1ED'
      }}>
        <div style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <svg width="90" height="90" viewBox="0 0 24 24" fill="none" stroke={dietary === 'veg' ? '#007A55' : '#F06A05'} strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
          </svg>
        </div>

        {/* Top Bar */}
        <div style={{
          position: 'absolute',
          top: '10px',
          left: '10px',
          right: '10px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          zIndex: 10
        }}>
          <button style={{
            width: '38px',
            height: '38px',
            borderRadius: '11px',
            background: 'white',
            color: '#1F140A',
            border: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            boxShadow: '0 2px 8px rgba(31,20,10,0.1)'
          }} aria-label="Go back">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>
            </svg>
          </button>
          <div style={{ display: 'flex', gap: '6px' }}>
            <button
              onClick={() => setIsSaved(!isSaved)}
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '11px',
                background: isSaved ? '#FFF0E3' : 'white',
                color: isSaved ? '#F06A05' : '#1F140A',
                border: isSaved ? '2px solid #F06A05' : 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                boxShadow: '0 2px 8px rgba(31,20,10,0.1)',
                transition: 'all 150ms ease'
              }}
              aria-label={isSaved ? 'Remove from saved' : 'Save item'}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill={isSaved ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
              </svg>
            </button>
            <button style={{
              width: '38px',
              height: '38px',
              borderRadius: '11px',
              background: 'white',
              color: '#1F140A',
              border: 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              boxShadow: '0 2px 8px rgba(31,20,10,0.1)'
            }} aria-label="Share">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
                <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
              </svg>
            </button>
          </div>
        </div>

        {/* Quick Action Bar - Bottom of Hero */}
        <div style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          padding: '12px 16px',
          background: 'linear-gradient(180deg, transparent 0%, rgba(31,20,10,0.85) 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, minWidth: 0 }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '9px', background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
              </svg>
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: '12px', fontWeight: '600', color: 'white', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {vendor.name}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '10px', opacity: 0.9 }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 10V6a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v4"/><polyline points="17 14 12 19 7 14"/><line x1="12" y1="2" x2="12" y2="22"/>
                  </svg>
                  {vendor.walkTime}
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
                  <svg width="9" height="9" viewBox="0 0 24 24" fill="white">
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                  </svg>
                  {vendor.rating.toFixed(1)}
                </span>
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
            <span style={{ fontSize: '14px', fontWeight: '600', fontVariantNumeric: 'tabular-nums', color: 'white' }}>₹{item.price}</span>
            <span style={{ color: 'rgba(255,255,255,0.5)' }}>×</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0', background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(8px)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.2)' }}>
              <button
                onClick={() => setQuantity(q => Math.max(q - 1, 1))}
                disabled={quantity <= 1}
                style={{
                  width: '32px',
                  height: '32px',
                  border: 'none',
                  background: quantity <= 1 ? 'transparent' : 'rgba(255,255,255,0.2)',
                  color: quantity <= 1 ? 'rgba(255,255,255,0.4)' : 'white',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: quantity <= 1 ? 'not-allowed' : 'pointer',
                  borderRadius: '8px 0 0 8px'
                }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="5" y1="12" x2="19" y2="12"/>
                </svg>
              </button>
              <span style={{ padding: '0 10px', fontSize: '14px', fontWeight: '600', fontVariantNumeric: 'tabular-nums', color: 'white', minWidth: '20px', textAlign: 'center' }}>
                {quantity}
              </span>
              <button
                onClick={() => setQuantity(q => Math.min(q + 1, 10))}
                disabled={quantity >= 10}
                style={{
                  width: '32px',
                  height: '32px',
                  border: 'none',
                  background: quantity >= 10 ? 'transparent' : 'rgba(255,255,255,0.2)',
                  color: quantity >= 10 ? 'rgba(255,255,255,0.4)' : 'white',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: quantity >= 10 ? 'not-allowed' : 'pointer',
                  borderRadius: '0 8px 8px 0'
                }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Dietary Badge - Floating */}
        <div className="dietary-badge" style={{
          position: 'absolute',
          left: '16px',
          top: '60px',
          display: 'inline-flex',
          alignItems: 'center',
          gap: '5px',
          fontSize: '10.5px',
          lineHeight: '15px',
          fontWeight: '600',
          color: dietary === 'veg' ? '#006B49' : dietary === 'nonveg' ? '#9A3C13' : '#6F6258',
          padding: '4px 10px',
          borderRadius: '6px',
          background: 'white',
          boxShadow: '0 2px 8px rgba(31,20,10,0.12)',
          zIndex: 5
        }}>
          <span className="dietary-symbol" style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '12px',
            height: '12px',
            border: `1.5px solid ${dietary === 'veg' ? '#007A55' : dietary === 'nonveg' ? '#B45309' : '#6F6258'}`,
            borderRadius: '2px',
            flexShrink: 0
          }}>
            {dietary === 'veg' ? (
              <i style={{ width: '5px', height: '5px', background: '#007A55', borderRadius: '50%' }} />
            ) : dietary === 'nonveg' ? (
              <i style={{ width: '0', height: '0', borderLeft: '3px solid transparent', borderRight: '3px solid transparent', borderBottom: '5px solid #9A3C13', borderRadius: '0', background: 'none' }} />
            ) : (
              <i style={{ width: '5px', height: '5px', background: '#6F6258', borderRadius: '50%' }} />
            )}
          </span>
          <span style={{ textTransform: 'capitalize', fontSize: '9.5px' }}>{dietary}</span>
        </div>
      </div>

      {/* Expandable Sections - Bottom Sheet Style */}
      <div className="detail-content" style={{ padding: '12px 12px 0', paddingBottom: '90px' }}>
        {/* Item Header */}
        <div style={{ marginBottom: '12px' }}>
          <h1 style={{ margin: '0 0 4px', fontSize: '20px', lineHeight: '26px', fontWeight: '700', color: '#1F140A', letterSpacing: '-0.3px' }}>
            {item.name}
          </h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '12px', color: '#7A6658', flexWrap: 'wrap' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="#C87809">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
              </svg>
              <strong style={{ color: '#1F140A' }}>{item.rating.toFixed(1)}</strong>
              <span>({item.reviewCount} reviews)</span>
            </span>
            <span style={{ color: '#D6DCE2' }}>•</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
              </svg>
              {item.prepTime}
            </span>
          </div>
        </div>

        {/* Expandable Section: Description */}
        <section style={{ marginBottom: '10px', background: 'white', borderRadius: '14px', border: '1px solid #F0E8E0', overflow: 'hidden' }}>
          <button
            onClick={() => toggleSection('description')}
            style={{
              width: '100%',
              padding: '14px 16px',
              border: 'none',
              background: 'transparent',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '12px',
              textAlign: 'left',
              cursor: 'pointer'
            }}
            aria-expanded={expandedSections.description}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#7A6658" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20"/><path d="M6.5 17H20"/>
              </svg>
              <span style={{ fontSize: '14px', fontWeight: '600', color: '#1F140A' }}>Description</span>
            </div>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#7A6658" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{
              flexShrink: 0,
              transform: expandedSections.description ? 'rotate(180deg)' : 'rotate(0deg)',
              transition: 'transform 200ms cubic-bezier(.23,1,.32,1)'
            }}>
              <polyline points="6 9 12 15 18 9"/>
            </svg>
          </button>
          <div style={{
            maxHeight: expandedSections.description ? '200px' : '0',
            opacity: expandedSections.description ? 1 : 0,
            overflow: 'hidden',
            transition: 'max-height 300ms cubic-bezier(.23,1,.32,1), opacity 200ms ease',
            padding: expandedSections.description ? '0 16px 16px' : '0 16px'
          }}>
            <p style={{ margin: 0, fontSize: '13px', lineHeight: '20px', color: '#1F140A', display: showFullDescription ? 'block' : '-webkit-box', WebkitLineClamp: showFullDescription ? 'unset' : 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
              {item.description}
            </p>
            {!showFullDescription && item.description.length > 150 && (
              <button
                onClick={() => setShowFullDescription(true)}
                style={{ marginTop: '8px', background: 'none', border: 'none', color: '#F06A05', fontSize: '12px', fontWeight: '600', cursor: 'pointer', padding: 0 }}
              >
                Show more
              </button>
            )}
          </div>
        </section>

        {/* Expandable Section: Portion & Customization */}
        <section style={{ marginBottom: '10px', background: 'white', borderRadius: '14px', border: '1px solid #F0E8E0', overflow: 'hidden' }}>
          <button
            onClick={() => toggleSection('portions')}
            style={{
              width: '100%',
              padding: '14px 16px',
              border: 'none',
              background: 'transparent',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '12px',
              textAlign: 'left',
              cursor: 'pointer'
            }}
            aria-expanded={expandedSections.portions}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#7A6658" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                <rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 9h6v6H9z"/>
              </svg>
              <span style={{ fontSize: '14px', fontWeight: '600', color: '#1F140A' }}>Portion & Options</span>
            </div>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#7A6658" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{
              flexShrink: 0,
              transform: expandedSections.portions ? 'rotate(180deg)' : 'rotate(0deg)',
              transition: 'transform 200ms cubic-bezier(.23,1,.32,1)'
            }}>
              <polyline points="6 9 12 15 18 9"/>
            </svg>
          </button>
          <div style={{
            maxHeight: expandedSections.portions ? '300px' : '0',
            opacity: expandedSections.portions ? 1 : 0,
            overflow: 'hidden',
            transition: 'max-height 300ms cubic-bezier(.23,1,.32,1), opacity 200ms ease',
            padding: expandedSections.portions ? '0 16px 16px' : '0 16px'
          }}>
            {item.portionSizes && item.portionSizes.length > 1 && (
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#7A6658', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '10px' }}>Select Portion</label>
                <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', scrollbarWidth: 'none', paddingBottom: '4px' }}>
                  {item.portionSizes.map((portion: PortionSize) => (
                    <button
                      key={portion.name}
                      onClick={() => setSelectedPortion(portion)}
                      style={{
                        flex: '0 0 auto',
                        minWidth: '90px',
                        padding: '12px 16px',
                        borderRadius: '12px',
                        background: selectedPortion?.name === portion.name ? '#FFF0E3' : '#F8F9FA',
                        border: selectedPortion?.name === portion.name ? '2px solid #F06A05' : '1px solid #F0E8E0',
                        color: selectedPortion?.name === portion.name ? '#A23D00' : '#1F140A',
                        fontSize: '13px',
                        fontWeight: selectedPortion?.name === portion.name ? '600' : '500',
                        cursor: 'pointer',
                        transition: 'all 150ms ease',
                        whiteSpace: 'nowrap'
                      }}
                      aria-pressed={selectedPortion?.name === portion.name}
                    >
                      {portion.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Customization Options - Simulated */}
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#7A6658', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '10px' }}>Customize</label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {[
                  { label: 'Spice Level', options: ['Mild', 'Medium', 'Hot', 'Extra Hot'] },
                  { label: 'Rice Type', options: ['Basmati', 'Brown Rice', 'Jeera Rice'] }
                ].map((custom, idx) => (
                  <div key={idx}>
                    <span style={{ fontSize: '12px', fontWeight: '500', color: '#1F140A', display: 'block', marginBottom: '6px' }}>{custom.label}</span>
                    <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', scrollbarWidth: 'none', paddingBottom: '2px' }}>
                      {custom.options.map((opt: string) => (
                        <button
                          key={opt}
                          style={{
                            flex: '0 0 auto',
                            padding: '8px 14px',
                            borderRadius: '10px',
                            background: '#F8F9FA',
                            border: '1px solid #F0E8E0',
                            color: '#1F140A',
                            fontSize: '11px',
                            fontWeight: '500',
                            cursor: 'pointer',
                            transition: 'all 150ms ease',
                            whiteSpace: 'nowrap'
                          }}
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Expandable Section: Nutrition */}
        <section style={{ marginBottom: '10px', background: 'white', borderRadius: '14px', border: '1px solid #F0E8E0', overflow: 'hidden' }}>
          <button
            onClick={() => toggleSection('nutrition')}
            style={{
              width: '100%',
              padding: '14px 16px',
              border: 'none',
              background: 'transparent',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '12px',
              textAlign: 'left',
              cursor: 'pointer'
            }}
            aria-expanded={expandedSections.nutrition}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#7A6658" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/><path d="M12 22v-4M12 14v-4M12 6V2"/>
              </svg>
              <span style={{ fontSize: '14px', fontWeight: '600', color: '#1F140A' }}>Nutrition Facts</span>
            </div>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#7A6658" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{
              flexShrink: 0,
              transform: expandedSections.nutrition ? 'rotate(180deg)' : 'rotate(0deg)',
              transition: 'transform 200ms cubic-bezier(.23,1,.32,1)'
            }}>
              <polyline points="6 9 12 15 18 9"/>
            </svg>
          </button>
          <div style={{
            maxHeight: expandedSections.nutrition ? '250px' : '0',
            opacity: expandedSections.nutrition ? 1 : 0,
            overflow: 'hidden',
            transition: 'max-height 300ms cubic-bezier(.23,1,.32,1), opacity 200ms ease',
            padding: expandedSections.nutrition ? '0 16px 16px' : '0 16px'
          }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
              {[
                { label: 'Calories', value: '485 kcal', color: '#F06A05' },
                { label: 'Protein', value: '28g', color: '#007A55' },
                { label: 'Carbs', value: '52g', color: '#C87809' },
                { label: 'Fat', value: '18g', color: '#9A3C13' },
                { label: 'Fiber', value: '4g', color: '#6F6258' },
                { label: 'Sugar', value: '6g', color: '#7A6658' },
                { label: 'Sodium', value: '680mg', color: '#9A3C13' },
                { label: 'Cholesterol', value: '75mg', color: '#F06A05' }
              ].map((nutrient, idx) => (
                <div key={idx} style={{ padding: '12px', background: '#F8F9FA', borderRadius: '10px', textAlign: 'center', border: '1px solid #F0E8E0' }}>
                  <div style={{ fontSize: '10px', fontWeight: '600', color: '#7A6658', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>{nutrient.label}</div>
                  <div style={{ fontSize: '16px', fontWeight: '700', color: nutrient.color, fontVariantNumeric: 'tabular-nums' }}>{nutrient.value}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Expandable Section: Allergens */}
        <section style={{ marginBottom: '10px', background: 'white', borderRadius: '14px', border: '1px solid #F0E8E0', overflow: 'hidden' }}>
          <button
            onClick={() => toggleSection('allergens')}
            style={{
              width: '100%',
              padding: '14px 16px',
              border: 'none',
              background: 'transparent',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '12px',
              textAlign: 'left',
              cursor: 'pointer'
            }}
            aria-expanded={expandedSections.allergens}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#7A6658" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                <circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/>
              </svg>
              <span style={{ fontSize: '14px', fontWeight: '600', color: '#1F140A' }}>Allergens</span>
            </div>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#7A6658" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{
              flexShrink: 0,
              transform: expandedSections.allergens ? 'rotate(180deg)' : 'rotate(0deg)',
              transition: 'transform 200ms cubic-bezier(.23,1,.32,1)'
            }}>
              <polyline points="6 9 12 15 18 9"/>
            </svg>
          </button>
          <div style={{
            maxHeight: expandedSections.allergens ? '150px' : '0',
            opacity: expandedSections.allergens ? 1 : 0,
            overflow: 'hidden',
            transition: 'max-height 300ms cubic-bezier(.23,1,.32,1), opacity 200ms ease',
            padding: expandedSections.allergens ? '0 16px 16px' : '0 16px'
          }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {['Gluten', 'Dairy', 'Soy', 'Nuts', 'Eggs'].map((allergen) => (
                <span key={allergen} style={{
                  fontSize: '12px',
                  fontWeight: '500',
                  color: '#9A3C13',
                  background: '#FCEAE4',
                  padding: '8px 14px',
                  borderRadius: '10px',
                  border: '1px solid #F5D0C0'
                }}>{allergen}</span>
              ))}
            </div>
          </div>
        </section>

        {/* Expandable Section: Reviews */}
        <section style={{ background: 'white', borderRadius: '14px', border: '1px solid #F0E8E0', overflow: 'hidden' }}>
          <button
            onClick={() => toggleSection('reviews')}
            style={{
              width: '100%',
              padding: '14px 16px',
              border: 'none',
              background: 'transparent',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '12px',
              textAlign: 'left',
              cursor: 'pointer'
            }}
            aria-expanded={expandedSections.reviews}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#7A6658" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
              </svg>
              <span style={{ fontSize: '14px', fontWeight: '600', color: '#1F140A' }}>Reviews</span>
              <span style={{ fontSize: '12px', color: '#7A6658', background: '#F5F1ED', padding: '2px 8px', borderRadius: '20px' }}>{item.reviewCount} reviews</span>
            </div>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#7A6658" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{
              flexShrink: 0,
              transform: expandedSections.reviews ? 'rotate(180deg)' : 'rotate(0deg)',
              transition: 'transform 200ms cubic-bezier(.23,1,.32,1)'
            }}>
              <polyline points="6 9 12 15 18 9"/>
            </svg>
          </button>
          <div style={{
            maxHeight: expandedSections.reviews ? '400px' : '0',
            opacity: expandedSections.reviews ? 1 : 0,
            overflow: 'hidden',
            transition: 'max-height 300ms cubic-bezier(.23,1,.32,1), opacity 200ms ease',
            padding: expandedSections.reviews ? '0 16px 16px' : '0 16px'
          }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {[
                { user: 'Priya S.', time: '2 days ago', rating: 5, text: 'Best biryani on campus! Perfect spice level and generous portion.' },
                { user: 'Arjun K.', time: '5 days ago', rating: 4, text: 'Good taste, but rice was a bit dry. Chicken was tender though.' },
                { user: 'Meera P.', time: '1 week ago', rating: 5, text: 'Ordered this 3 times this week. Consistently delicious!' },
                { user: 'Rohan M.', time: '2 weeks ago', rating: 4, text: 'Quick delivery, hot food. Will order again.' },
                { user: 'Sneha R.', time: '3 weeks ago', rating: 5, text: 'The best biryani I\'ve had in college. Spices are balanced perfectly.' }
              ].map((review, idx) => (
                <div key={idx} style={{ padding: '12px', background: '#F8F9FA', borderRadius: '10px', border: '1px solid #F0E8E0' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                    <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'linear-gradient(135deg, #F06A05 0%, #FF8618 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '12px', fontWeight: '600' }}>
                      {review.user.charAt(0)}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '13px', fontWeight: '600', color: '#1F140A' }}>{review.user}</div>
                      <div style={{ fontSize: '10px', color: '#7A6658' }}>{review.time}</div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '2px', color: '#C87809' }}>
                      {[...Array(5)].map((_, i) => (
                        <svg key={i} width="11" height="11" viewBox="0 0 24 24" fill={i < review.rating ? '#C87809' : '#F0E8E0'}>
                          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                        </svg>
                      ))}
                    </div>
                  </div>
                  <p style={{ margin: 0, fontSize: '12px', lineHeight: '18px', color: '#1F140A' }}>{review.text}</p>
                </div>
              ))}
            </div>
            <div style={{ textAlign: 'center', marginTop: '8px' }}>
              <button style={{ background: 'none', border: '1px solid #F06A05', color: '#F06A05', padding: '10px 20px', borderRadius: '10px', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}>
                Load more reviews
              </button>
            </div>
          </div>
        </section>
      </div>

      {/* Floating Add to Cart Button - Always Visible */}
      <div style={{
        position: 'fixed',
        bottom: '20px',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 50,
        width: 'calc(100% - 32px)',
        maxWidth: '375px',
        pointerEvents: 'none'
      }}>
        <button
          style={{
            pointerEvents: 'auto',
            width: '100%',
            height: '52px',
            borderRadius: '14px',
            background: 'linear-gradient(135deg, #F06A05 0%, #E05C00 100%)',
            color: 'white',
            border: 'none',
            fontSize: '16px',
            fontWeight: '600',
            cursor: 'pointer',
            boxShadow: '0 8px 24px rgba(240,106,5,0.4), 0 2px 6px rgba(31,20,10,0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '10px',
            transition: 'all 150ms cubic-bezier(.23,1,.32,1)'
          }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          <span>Add {quantity} item{quantity !== 1 ? 's' : ''} to Order</span>
          <span style={{ fontSize: '18px', fontWeight: '700', fontVariantNumeric: 'tabular-nums' }}>₹{item.price * quantity}</span>
        </button>
      </div>
    </div>
  );
}

export default FoodItemDetailVariantD;