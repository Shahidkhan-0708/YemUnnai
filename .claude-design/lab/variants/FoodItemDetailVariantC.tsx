// Food Item Detail - Variant C: Density Variation (Compact)
// More information visible per scroll, tighter spacing, efficient use of screen real estate
// Tradeoff: more data visible vs easier scanning - optimized for quick decisions

import React, { useState } from 'react';
import { MOCK_FOOD_ITEMS, MOCK_VENDORS, FoodItem, Vendor } from '../data/fixtures';

const item = MOCK_FOOD_ITEMS[0];
const vendor = MOCK_VENDORS.find(v => v.id === item.vendorId)!;
const dietary = item.dietary;

export function FoodItemDetailVariantC() {
  const [quantity, setQuantity] = useState(1);
  const [selectedPortion, setSelectedPortion] = useState(item.portionSizes?.[0] || 'Regular');
  const [isSaved, setIsSaved] = useState(false);

  return (
    <div className="detail-screen" style={{ minHeight: '812px', width: '375px', margin: '0 auto', background: '#E8ECEF', position: 'relative', fontFamily: 'Plus Jakarta Sans, system-ui, sans-serif' }}>
      {/* Ultra-Compact Hero */}
      <div className="detail-hero" style={{
        position: 'relative',
        height: '180px',
        background: dietary === 'veg' ? '#E6F5ED' : dietary === 'nonveg' ? '#FCEAE4' : '#F5F1ED'
      }}>
        <div style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke={dietary === 'veg' ? '#007A55' : '#F06A05'} strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
          </svg>
        </div>

        {/* Top Bar - Compact */}
        <div style={{
          position: 'absolute',
          top: '8px',
          left: '8px',
          right: '8px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          zIndex: 10
        }}>
          <button style={{
            width: '36px',
            height: '36px',
            borderRadius: '10px',
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
                width: '36px',
                height: '36px',
                borderRadius: '10px',
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
              width: '36px',
              height: '36px',
              borderRadius: '10px',
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

        {/* Dietary Badge - Bottom Left */}
        <div className="dietary-badge" style={{
          position: 'absolute',
          left: '12px',
          bottom: '12px',
          display: 'inline-flex',
          alignItems: 'center',
          gap: '4px',
          fontSize: '10px',
          lineHeight: '14px',
          fontWeight: '600',
          color: dietary === 'veg' ? '#006B49' : dietary === 'nonveg' ? '#9A3C13' : '#6F6258',
          padding: '4px 10px',
          borderRadius: '6px',
          background: 'white',
          boxShadow: '0 2px 6px rgba(31,20,10,0.1)'
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
          <span style={{ textTransform: 'capitalize', fontSize: '9px' }}>{dietary}</span>
        </div>

        {/* Vendor Pill - Bottom Right */}
        <div style={{
          position: 'absolute',
          right: '12px',
          bottom: '12px',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          padding: '4px 10px',
          borderRadius: '20px',
          background: 'rgba(255,255,255,0.95)',
          backdropFilter: 'blur(8px)',
          boxShadow: '0 2px 8px rgba(31,20,10,0.1)'
        }}>
          <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: 'linear-gradient(135deg, #F06A05 0%, #FF8618 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
            </svg>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', minWidth: 0 }}>
            <span style={{ fontSize: '11px', fontWeight: '600', color: '#1F140A', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {vendor.name}
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '3px', fontSize: '9px', color: '#7A6658' }}>
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 10V6a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v4"/><polyline points="17 14 12 19 7 14"/><line x1="12" y1="2" x2="12" y2="22"/>
              </svg>
              {vendor.walkTime}
            </span>
          </div>
        </div>
      </div>

      {/* Dense Content */}
      <div className="detail-content" style={{ padding: '12px', paddingBottom: '90px' }}>
        {/* Name Row with Rating */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px', marginBottom: '8px' }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h1 style={{ margin: '0 0 4px', fontSize: '18px', lineHeight: '24px', fontWeight: '700', color: '#1F140A', letterSpacing: '-0.3px' }}>
              {item.name}
            </h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px', color: '#7A6658' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="#C87809">
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                </svg>
                <strong style={{ color: '#1F140A' }}>{item.rating.toFixed(1)}</strong>
                <span>({item.reviewCount})</span>
              </span>
              <span style={{ color: '#D6DCE2' }}>•</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
                </svg>
                {item.prepTime}
              </span>
              <span style={{ color: '#D6DCE2' }}>•</span>
              <span style={{ fontSize: '10px', fontWeight: '600', color: vendor.isOnline ? '#007A55' : '#D6DCE2', background: vendor.isOnline ? '#E6F5ED' : '#F5F1ED', padding: '2px 6px', borderRadius: '4px' }}>
                {vendor.isOnline ? 'Open' : 'Closed'}
              </span>
            </div>
          </div>
        </div>

        {/* Description - Compact, 2 lines */}
        <p style={{ margin: '0 0 12px', fontSize: '12px', lineHeight: '18px', color: '#1F140A', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
          {item.description}
        </p>

        {/* Compact Section Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '12px' }}>
          {/* Portion Selector */}
          {item.portionSizes && item.portionSizes.length > 1 && (
            <div style={{ gridColumn: 'span 2' }}>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: '600', color: '#7A6658', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px' }}>Portion</label>
              <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', scrollbarWidth: 'none', paddingBottom: '2px' }}>
                {item.portionSizes.map((portion: string) => (
                  <button
                    key={portion}
                    onClick={() => setSelectedPortion(portion)}
                    style={{
                      flex: '0 0 auto',
                      padding: '6px 12px',
                      borderRadius: '8px',
                      background: selectedPortion === portion ? '#FFF0E3' : '#F8F9FA',
                      border: selectedPortion === portion ? '2px solid #F06A05' : '1px solid #F0E8E0',
                      color: selectedPortion === portion ? '#A23D00' : '#1F140A',
                      fontSize: '11px',
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

          {/* Price Card */}
          <div style={{ padding: '10px', background: 'white', borderRadius: '10px', border: '1px solid #F0E8E0' }}>
            <div style={{ fontSize: '10px', color: '#7A6658', fontWeight: '500', marginBottom: '2px' }}>Price</div>
            <strong style={{ fontSize: '18px', fontWeight: '700', fontVariantNumeric: 'tabular-nums', color: '#1F140A' }}>₹{item.price}</strong>
          </div>

          {/* Quantity Card */}
          <div style={{ padding: '10px', background: 'white', borderRadius: '10px', border: '1px solid #F0E8E0' }}>
            <div style={{ fontSize: '10px', color: '#7A6658', fontWeight: '500', marginBottom: '2px' }}>Qty</div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0', background: '#F5F1ED', borderRadius: '8px', border: '1px solid #E8ECEF' }}>
              <button
                onClick={() => setQuantity(q => Math.max(q - 1, 1))}
                disabled={quantity <= 1}
                style={{
                  width: '36px',
                  height: '36px',
                  border: 'none',
                  background: quantity <= 1 ? 'transparent' : 'white',
                  color: quantity <= 1 ? '#D6DCE2' : '#1F140A',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: quantity <= 1 ? 'not-allowed' : 'pointer',
                  borderRadius: '8px 0 0 8px'
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="5" y1="12" x2="19" y2="12"/>
                </svg>
              </button>
              <span style={{ padding: '0 14px', fontSize: '16px', fontWeight: '600', fontVariantNumeric: 'tabular-nums', color: '#1F140A', minWidth: '24px', textAlign: 'center' }}>
                {quantity}
              </span>
              <button
                onClick={() => setQuantity(q => Math.min(q + 1, 10))}
                disabled={quantity >= 10}
                style={{
                  width: '36px',
                  height: '36px',
                  border: 'none',
                  background: quantity >= 10 ? 'transparent' : 'white',
                  color: quantity >= 10 ? '#D6DCE2' : '#1F140A',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: quantity >= 10 ? 'not-allowed' : 'pointer',
                  borderRadius: '0 8px 8px 0'
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                </svg>
              </button>
            </div>
          </div>

          {/* Tags */}
          <div style={{ gridColumn: 'span 2', padding: '10px', background: 'white', borderRadius: '10px', border: '1px solid #F0E8E0' }}>
            <div style={{ fontSize: '10px', fontWeight: '600', color: '#7A6658', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px' }}>Highlights</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {item.tags.map((tag: string) => (
                <span key={tag} style={{
                  fontSize: '10px',
                  fontWeight: '500',
                  color: '#F06A05',
                  background: '#FFF0E3',
                  padding: '4px 10px',
                  borderRadius: '16px'
                }}>{tag}</span>
              ))}
            </div>
          </div>

          {/* Nutrition Preview */}
          <div style={{ padding: '10px', background: 'white', borderRadius: '10px', border: '1px solid #F0E8E0' }}>
            <div style={{ fontSize: '10px', fontWeight: '600', color: '#7A6658', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px' }}>Nutrition</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {[
                { label: 'Calories', value: '485 kcal', color: '#F06A05' },
                { label: 'Protein', value: '28g', color: '#007A55' },
                { label: 'Carbs', value: '52g', color: '#C87809' },
                { label: 'Fat', value: '18g', color: '#9A3C13' }
              ].map((nutrient, idx) => (
                <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '11px', color: '#7A6658' }}>{nutrient.label}</span>
                  <span style={{ fontSize: '11px', fontWeight: '600', color: nutrient.color, fontVariantNumeric: 'tabular-nums' }}>{nutrient.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Allergens */}
          <div style={{ padding: '10px', background: 'white', borderRadius: '10px', border: '1px solid #F0E8E0' }}>
            <div style={{ fontSize: '10px', fontWeight: '600', color: '#7A6658', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px' }}>Allergens</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
              {['Gluten', 'Dairy', 'Soy'].map((allergen) => (
                <span key={allergen} style={{
                  fontSize: '9.5px',
                  fontWeight: '500',
                  color: '#9A3C13',
                  background: '#FCEAE4',
                  padding: '3px 8px',
                  borderRadius: '12px'
                }}>{allergen}</span>
              ))}
            </div>
          </div>
        </div>

        {/* Reviews - Compact List */}
        <div style={{ marginTop: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <h4 style={{ margin: 0, fontSize: '13px', fontWeight: '600', color: '#1F140A' }}>Reviews</h4>
            <button style={{ background: 'none', border: 'none', color: '#F06A05', fontSize: '11px', fontWeight: '600', cursor: 'pointer', padding: 0 }}>View all</button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {[
              { user: 'Priya S.', time: '2 days ago', rating: 5, text: 'Best biryani on campus! Perfect spice level and generous portion.' },
              { user: 'Arjun K.', time: '5 days ago', rating: 4, text: 'Good taste, but rice was a bit dry. Chicken was tender though.' },
              { user: 'Meera P.', time: '1 week ago', rating: 5, text: 'Ordered this 3 times this week. Consistently delicious!' }
            ].map((review, idx) => (
              <div key={idx} style={{ background: 'white', borderRadius: '10px', padding: '10px', border: '1px solid #F0E8E0' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                  <div style={{ width: '26px', height: '26px', borderRadius: '50%', background: 'linear-gradient(135deg, #F06A05 0%, #FF8618 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '11px', fontWeight: '600' }}>
                    {review.user.charAt(0)}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '12px', fontWeight: '600', color: '#1F140A', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{review.user}</div>
                    <div style={{ fontSize: '10px', color: '#7A6658' }}>{review.time}</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1px', color: '#C87809' }}>
                    {[...Array(5)].map((_, i) => (
                      <svg key={i} width="10" height="10" viewBox="0 0 24 24" fill={i < review.rating ? '#C87809' : '#F0E8E0'}>
                        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                      </svg>
                    ))}
                  </div>
                </div>
                <p style={{ margin: 0, fontSize: '11px', lineHeight: '16px', color: '#1F140A', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{review.text}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Compact Sticky Bottom Bar */}
      <div style={{
        position: 'fixed',
        bottom: 0,
        left: '50%',
        transform: 'translateX(-50%)',
        width: '100%',
        maxWidth: '375px',
        padding: '10px 12px',
        background: 'white',
        borderTop: '1px solid #F0E8E0',
        boxShadow: '0 -4px 16px rgba(31,20,10,0.08)',
        zIndex: 50
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
          <div>
            <div style={{ fontSize: '11px', color: '#7A6658', fontWeight: '500' }}>Total ({quantity} item{quantity !== 1 ? 's' : ''})</div>
            <div style={{ fontSize: '18px', lineHeight: '24px', fontWeight: '700', fontVariantNumeric: 'tabular-nums', color: '#1F140A' }}>₹{item.price * quantity}</div>
          </div>
          <button style={{
            flex: 1,
            maxWidth: '180px',
            height: '44px',
            borderRadius: '12px',
            background: '#F06A05',
            color: 'white',
            border: 'none',
            fontSize: '13px',
            fontWeight: '600',
            cursor: 'pointer',
            boxShadow: '0 3px 12px rgba(240,106,5,0.35)',
            transition: 'all 150ms ease'
          }}>
            Add to Order
          </button>
        </div>
      </div>
    </div>
  );
}

export default FoodItemDetailVariantC;