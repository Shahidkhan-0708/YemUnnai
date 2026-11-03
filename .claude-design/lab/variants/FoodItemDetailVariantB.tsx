// Food Item Detail - Variant B: Layout Model Exploration
// Split-pane layout with sticky photo sidebar, horizontal scrolling sections
// Zomato-style: persistent image, tabbed content areas, contextual actions

import React, { useState } from 'react';
import { MOCK_FOOD_ITEMS, MOCK_VENDORS, FoodItem, Vendor } from '../data/fixtures';

const item = MOCK_FOOD_ITEMS[0]; // Chicken Biryani
const vendor = MOCK_VENDORS.find(v => v.id === item.vendorId)!;
const dietary = item.dietary;

export function FoodItemDetailVariantB() {
  const [quantity, setQuantity] = useState(1);
  const [selectedPortion, setSelectedPortion] = useState(item.portionSizes?.[0] || 'Regular');
  const [activeTab, setActiveTab] = useState<'details' | 'reviews' | 'nutrition'>('details');
  const [isSaved, setIsSaved] = useState(false);

  const tabs = [
    { id: 'details', label: 'Details', icon: 'details' },
    { id: 'reviews', label: 'Reviews', icon: 'reviews' },
    { id: 'nutrition', label: 'Nutrition', icon: 'nutrition' }
  ];

  return (
    <div className="detail-screen" style={{ minHeight: '812px', width: '375px', margin: '0 auto', background: '#E8ECEF', position: 'relative', fontFamily: 'Plus Jakarta Sans, system-ui, sans-serif' }}>
      {/* Top Bar - Sticky */}
      <header style={{
        position: 'sticky',
        top: 0,
        zIndex: 40,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: '56px',
        padding: '0 16px',
        background: 'rgba(255,255,255,0.95)',
        backdropFilter: 'blur(12px)',
        borderBottom: '1px solid #F0E8E0'
      }}>
        <button style={{
          width: '40px',
          height: '40px',
          borderRadius: '12px',
          background: 'white',
          color: '#1F140A',
          border: '1px solid #F0E8E0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          boxShadow: '0 1px 3px rgba(31,20,10,0.05)'
        }} aria-label="Go back">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>
          </svg>
        </button>
        <h2 style={{ margin: 0, fontSize: '16px', fontWeight: '600', color: '#1F140A', flex: 1, textAlign: 'center' }}>
          {item.name}
        </h2>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={() => setIsSaved(!isSaved)}
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '12px',
              background: isSaved ? '#FFF0E3' : 'white',
              color: isSaved ? '#F06A05' : '#1F140A',
              border: isSaved ? '2px solid #F06A05' : '1px solid #F0E8E0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'all 150ms ease'
            }}
            aria-label={isSaved ? 'Remove from saved' : 'Save item'}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill={isSaved ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
            </svg>
          </button>
          <button style={{
            width: '40px',
            height: '40px',
            borderRadius: '12px',
            background: 'white',
            color: '#1F140A',
            border: '1px solid #F0E8E0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer'
          }} aria-label="Share">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
              <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
            </svg>
          </button>
        </div>
      </header>

      {/* Split Layout: Image Sidebar + Content Area */}
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        {/* Hero Image - Full Width on Mobile, Sidebar on Desktop */}
        <div className="detail-hero" style={{
          position: 'relative',
          height: '240px',
          background: dietary === 'veg' ? '#E6F5ED' : dietary === 'nonveg' ? '#FCEAE4' : '#F5F1ED'
        }}>
          <div style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <svg width="100" height="100" viewBox="0 0 24 24" fill="none" stroke={dietary === 'veg' ? '#007A55' : '#F06A05'} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
            </svg>
          </div>

          {/* Dietary Badge - Top Left */}
          <div className="dietary-badge" style={{
            position: 'absolute',
            left: '16px',
            top: '16px',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '11px',
            lineHeight: '16px',
            fontWeight: '600',
            color: dietary === 'veg' ? '#006B49' : dietary === 'nonveg' ? '#9A3C13' : '#6F6258',
            padding: '5px 12px',
            borderRadius: '8px',
            background: 'white',
            boxShadow: '0 2px 8px rgba(31,20,10,0.1)'
          }}>
            <span className="dietary-symbol" style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '14px',
              height: '14px',
              border: `1.5px solid ${dietary === 'veg' ? '#007A55' : dietary === 'nonveg' ? '#B45309' : '#6F6258'}`,
              borderRadius: '3px',
              flexShrink: 0
            }}>
              {dietary === 'veg' ? (
                <i style={{ width: '6px', height: '6px', background: '#007A55', borderRadius: '50%' }} />
              ) : dietary === 'nonveg' ? (
                <i style={{ width: '0', height: '0', borderLeft: '3.5px solid transparent', borderRight: '3.5px solid transparent', borderBottom: '6px solid #9A3C13', borderRadius: '0', background: 'none' }} />
              ) : (
                <i style={{ width: '6px', height: '6px', background: '#6F6258', borderRadius: '50%' }} />
              )}
            </span>
            <span style={{ textTransform: 'capitalize' }}>{dietary}</span>
          </div>

          {/* Vendor Quick Info - Bottom Overlay */}
          <div style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            padding: '16px',
            background: 'linear-gradient(180deg, transparent 0%, rgba(31,20,10,0.7) 100%)',
            color: 'white'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                background: 'rgba(255,255,255,0.2)',
                backdropFilter: 'blur(8px)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
                </svg>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '13px', fontWeight: '600' }}>{vendor.name}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px', opacity: 0.9 }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 10V6a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v4"/><polyline points="17 14 12 19 7 14"/><line x1="12" y1="2" x2="12" y2="22"/>
                    </svg>
                    {vendor.walkTime}
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="white">
                      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                    </svg>
                    {vendor.rating.toFixed(1)}
                  </span>
                </div>
              </div>
              <span style={{ fontSize: '11px', fontWeight: '600', background: 'rgba(0,122,85,0.9)', padding: '4px 10px', borderRadius: '20px' }}>
                {vendor.isOnline ? 'Open now' : 'Closed'}
              </span>
            </div>
          </div>
        </div>

        {/* Tab Bar - Sticky */}
        <div style={{
          position: 'sticky',
          top: '56px',
          zIndex: 30,
          display: 'flex',
          background: 'white',
          borderBottom: '1px solid #F0E8E0'
        }}>
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              style={{
                flex: 1,
                padding: '12px 8px',
                border: 'none',
                background: 'transparent',
                color: activeTab === tab.id ? '#F06A05' : '#7A6658',
                fontSize: '12px',
                fontWeight: activeTab === tab.id ? '600' : '500',
                cursor: 'pointer',
                position: 'relative',
                transition: 'color 150ms ease'
              }}
              aria-selected={activeTab === tab.id}
            >
              {tab.label}
              {activeTab === tab.id && (
                <div style={{
                  position: 'absolute',
                  bottom: '-1px',
                  left: '20%',
                  right: '20%',
                  height: '3px',
                  borderRadius: '3px 3px 0 0',
                  background: 'linear-gradient(90deg, #F06A05 0%, #FF8618 100%)'
                }} />
              )}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="detail-content" style={{ flex: 1, padding: '16px', paddingBottom: '100px' }}>
          {activeTab === 'details' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {/* Item Header */}
              <div>
                <h1 style={{ margin: '0 0 8px', fontSize: '24px', lineHeight: '32px', fontWeight: '700', color: '#1F140A', letterSpacing: '-0.5px' }}>
                  {item.name}
                </h1>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="#C87809">
                      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                    </svg>
                    <span style={{ fontSize: '15px', fontWeight: '600', color: '#1F140A' }}>{item.rating.toFixed(1)}</span>
                    <span style={{ fontSize: '13px', color: '#7A6658' }}>({item.reviewCount} reviews)</span>
                  </div>
                  <span style={{ color: '#D6DCE2' }}>•</span>
                  <span style={{ fontSize: '13px', color: '#7A6658', display: 'flex', alignItems: 'center', gap: '3px' }}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
                    </svg>
                    {item.prepTime}
                  </span>
                </div>
              </div>

              {/* Description */}
              <div style={{ padding: '16px', background: 'white', borderRadius: '16px', border: '1px solid #F0E8E0' }}>
                <p style={{ margin: 0, fontSize: '14px', lineHeight: '22px', color: '#1F140A' }}>{item.description}</p>
              </div>

              {/* Portion Selector */}
              {item.portionSizes && item.portionSizes.length > 1 && (
                <div style={{ padding: '16px', background: 'white', borderRadius: '16px', border: '1px solid #F0E8E0' }}>
                  <h4 style={{ margin: '0 0 12px', fontSize: '14px', fontWeight: '600', color: '#1F140A' }}>Select portion</h4>
                  <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', scrollbarWidth: 'none', paddingBottom: '4px' }}>
                    {item.portionSizes.map((portion: string) => (
                      <button
                        key={portion}
                        onClick={() => setSelectedPortion(portion)}
                        style={{
                          flex: '0 0 auto',
                          minWidth: '90px',
                          padding: '10px 16px',
                          borderRadius: '12px',
                          background: selectedPortion === portion ? '#FFF0E3' : '#F8F9FA',
                          border: selectedPortion === portion ? '2px solid #F06A05' : '1px solid #F0E8E0',
                          color: selectedPortion === portion ? '#A23D00' : '#1F140A',
                          fontSize: '13px',
                          fontWeight: selectedPortion === portion ? '600' : '500',
                          cursor: 'pointer',
                          transition: 'all 150ms ease',
                          whiteSpace: 'nowrap'
                        }}
                        aria-pressed={selectedPortion === portion}
                      >
                        {portion}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Price & Quantity Card */}
              <div style={{ padding: '16px', background: 'white', borderRadius: '16px', border: '1px solid #F0E8E0' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
                  <div>
                    <span style={{ fontSize: '13px', color: '#7A6658', fontWeight: '500', display: 'block', marginBottom: '4px' }}>Price per portion</span>
                    <strong style={{ fontSize: '28px', lineHeight: '36px', fontWeight: '700', fontVariantNumeric: 'tabular-nums', color: '#1F140A' }}>₹{item.price}</strong>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0', background: '#F5F1ED', borderRadius: '12px', border: '1px solid #E8ECEF' }}>
                    <button
                      onClick={() => setQuantity(q => Math.max(q - 1, 1))}
                      disabled={quantity <= 1}
                      style={{
                        width: '44px',
                        height: '44px',
                        border: 'none',
                        background: quantity <= 1 ? 'transparent' : 'white',
                        color: quantity <= 1 ? '#D6DCE2' : '#1F140A',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: quantity <= 1 ? 'not-allowed' : 'pointer',
                        borderRadius: '12px 0 0 12px'
                      }}
                    >
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="5" y1="12" x2="19" y2="12"/>
                      </svg>
                    </button>
                    <span style={{ padding: '0 20px', fontSize: '18px', fontWeight: '600', fontVariantNumeric: 'tabular-nums', color: '#1F140A', minWidth: '32px', textAlign: 'center' }}>
                      {quantity}
                    </span>
                    <button
                      onClick={() => setQuantity(q => Math.min(q + 1, 10))}
                      disabled={quantity >= 10}
                      style={{
                        width: '44px',
                        height: '44px',
                        border: 'none',
                        background: quantity >= 10 ? 'transparent' : 'white',
                        color: quantity >= 10 ? '#D6DCE2' : '#1F140A',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: quantity >= 10 ? 'not-allowed' : 'pointer',
                        borderRadius: '0 12px 12px 0'
                      }}
                    >
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                      </svg>
                    </button>
                  </div>
                </div>
              </div>

              {/* Tags */}
              <div style={{ padding: '16px', background: 'white', borderRadius: '16px', border: '1px solid #F0E8E0' }}>
                <h4 style={{ margin: '0 0 10px', fontSize: '13px', fontWeight: '600', color: '#7A6658', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Highlights</h4>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {item.tags.map((tag: string) => (
                    <span key={tag} style={{
                      fontSize: '11px',
                      fontWeight: '500',
                      color: '#F06A05',
                      background: '#FFF0E3',
                      padding: '5px 12px',
                      borderRadius: '20px'
                    }}>{tag}</span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'reviews' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {[
                { user: 'Priya S.', time: '2 days ago', rating: 5, text: 'Best biryani on campus! Perfect spice level and generous portion.' },
                { user: 'Arjun K.', time: '5 days ago', rating: 4, text: 'Good taste, but rice was a bit dry. Chicken was tender though.' },
                { user: 'Meera P.', time: '1 week ago', rating: 5, text: 'Ordered this 3 times this week. Consistently delicious!' },
                { user: 'Rohan M.', time: '2 weeks ago', rating: 4, text: 'Quick delivery, hot food. Will order again.' },
                { user: 'Sneha R.', time: '3 weeks ago', rating: 5, text: 'The best biryani I\'ve had in college. Spices are balanced perfectly.' }
              ].map((review, idx) => (
                <div key={idx} style={{ background: 'white', borderRadius: '16px', padding: '16px', border: '1px solid #F0E8E0' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                    <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'linear-gradient(135deg, #F06A05 0%, #FF8618 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '13px', fontWeight: '600' }}>
                      {review.user.charAt(0)}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '14px', fontWeight: '600', color: '#1F140A' }}>{review.user}</div>
                      <div style={{ fontSize: '11px', color: '#7A6658' }}>{review.time}</div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '2px', color: '#C87809' }}>
                      {[...Array(5)].map((_, i) => (
                        <svg key={i} width="12" height="12" viewBox="0 0 24 24" fill={i < review.rating ? '#C87809' : '#F0E8E0'}>
                          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                        </svg>
                      ))}
                    </div>
                  </div>
                  <p style={{ margin: 0, fontSize: '13px', lineHeight: '20px', color: '#1F140A' }}>{review.text}</p>
                </div>
              ))}
              <div style={{ textAlign: 'center', padding: '16px' }}>
                <button style={{ background: 'none', border: '1px solid #F06A05', color: '#F06A05', padding: '12px 24px', borderRadius: '12px', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}>
                  Load more reviews
                </button>
              </div>
            </div>
          )}

          {activeTab === 'nutrition' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ padding: '16px', background: 'white', borderRadius: '16px', border: '1px solid #F0E8E0' }}>
                <h4 style={{ margin: '0 0 16px', fontSize: '15px', fontWeight: '600', color: '#1F140A' }}>Nutritional Information (per portion)</h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
                  {[
                    { label: 'Calories', value: '485 kcal', color: '#F06A05' },
                    { label: 'Protein', value: '28g', color: '#007A55' },
                    { label: 'Carbs', value: '52g', color: '#C87809' },
                    { label: 'Fat', value: '18g', color: '#9A3C13' },
                    { label: 'Fiber', value: '4g', color: '#6F6258' },
                    { label: 'Sodium', value: '680mg', color: '#7A6658' }
                  ].map((nutrient, idx) => (
                    <div key={idx} style={{ padding: '14px', background: '#F8F9FA', borderRadius: '12px', textAlign: 'center', border: '1px solid #F0E8E0' }}>
                      <div style={{ fontSize: '11px', fontWeight: '600', color: '#7A6658', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>{nutrient.label}</div>
                      <div style={{ fontSize: '18px', fontWeight: '700', color: nutrient.color, fontVariantNumeric: 'tabular-nums' }}>{nutrient.value}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ padding: '16px', background: 'white', borderRadius: '16px', border: '1px solid #F0E8E0' }}>
                <h4 style={{ margin: '0 0 12px', fontSize: '14px', fontWeight: '600', color: '#1F140A' }}>Allergens</h4>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {['Gluten', 'Dairy', 'Soy'].map((allergen) => (
                    <span key={allergen} style={{
                      fontSize: '11px',
                      fontWeight: '500',
                      color: '#9A3C13',
                      background: '#FCEAE4',
                      padding: '5px 12px',
                      borderRadius: '20px'
                    }}>{allergen}</span>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Sticky Bottom Bar */}
      <div style={{
        position: 'fixed',
        bottom: 0,
        left: '50%',
        transform: 'translateX(-50%)',
        width: '100%',
        maxWidth: '375px',
        padding: '12px 16px',
        background: 'white',
        borderTop: '1px solid #F0E8E0',
        boxShadow: '0 -4px 20px rgba(31,20,10,0.08)',
        zIndex: 50
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px' }}>
          <div>
            <div style={{ fontSize: '12px', color: '#7A6658', fontWeight: '500' }}>Total for {quantity} item{quantity !== 1 ? 's' : ''}</div>
            <div style={{ fontSize: '22px', lineHeight: '28px', fontWeight: '700', fontVariantNumeric: 'tabular-nums', color: '#1F140A' }}>₹{item.price * quantity}</div>
          </div>
          <button style={{
            flex: 1,
            maxWidth: '200px',
            height: '48px',
            borderRadius: '14px',
            background: '#F06A05',
            color: 'white',
            border: 'none',
            fontSize: '15px',
            fontWeight: '600',
            cursor: 'pointer',
            boxShadow: '0 4px 16px rgba(240,106,5,0.35)',
            transition: 'all 150ms ease'
          }}>
            Add to Order
          </button>
        </div>
      </div>
    </div>
  );
}

export default FoodItemDetailVariantB;