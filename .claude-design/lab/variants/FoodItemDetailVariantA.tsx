// Food Item Detail - Variant A: Information Hierarchy Focus
// Clear visual hierarchy with prominent photo, key info above fold, progressive disclosure
// Swiggy-style: hero photo, sticky action bar, organized sections

import React, { useState } from 'react';
import { MOCK_FOOD_ITEMS, MOCK_VENDORS, FoodItem, Vendor } from '../data/fixtures';

const item = MOCK_FOOD_ITEMS[0]; // Chicken Biryani
const vendor = MOCK_VENDORS.find(v => v.id === item.vendorId)!;
const dietary = item.dietary;

export function FoodItemDetailVariantA() {
  const [quantity, setQuantity] = useState(1);
  const [selectedPortion, setSelectedPortion] = useState(item.portionSizes?.[0] || 'Regular');
  const [showFullDescription, setShowFullDescription] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  const increment = () => setQuantity(q => Math.min(q + 1, 10));
  const decrement = () => setQuantity(q => Math.max(q - 1, 1));

  return (
    <div className="detail-screen" style={{ minHeight: '812px', width: '375px', margin: '0 auto', background: '#E8ECEF', position: 'relative', fontFamily: 'Plus Jakarta Sans, system-ui, sans-serif' }}>
      {/* Hero Image Section */}
      <div className="detail-hero" style={{
        position: 'relative',
        height: '280px',
        background: dietary === 'veg' ? '#E6F5ED' : dietary === 'nonveg' ? '#FCEAE4' : '#F5F1ED'
      }}>
        <div style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <svg width="120" height="120" viewBox="0 0 24 24" fill="none" stroke={dietary === 'veg' ? '#007A55' : '#F06A05'} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
          </svg>
        </div>

        {/* Dietary Badge */}
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

        {/* Save Button */}
        <button
          onClick={() => setIsSaved(!isSaved)}
          style={{
            position: 'absolute',
            right: '16px',
            top: '16px',
            width: '40px',
            height: '40px',
            borderRadius: '12px',
            background: 'white',
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
          <svg width="20" height="20" viewBox="0 0 24 24" fill={isSaved ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
          </svg>
        </button>

        {/* Back Button */}
        <button style={{
          position: 'absolute',
          left: '16px',
          bottom: '16px',
          width: '40px',
          height: '40px',
          borderRadius: '12px',
          background: 'white',
          color: '#1F140A',
          border: 'none',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          boxShadow: '0 2px 8px rgba(31,20,10,0.1)'
        }} aria-label="Go back">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>
          </svg>
        </button>
      </div>

      {/* Content Area */}
      <div className="detail-content" style={{ padding: '16px', paddingBottom: '100px' }}>
        {/* Vendor Info Row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
          <div style={{
            width: '44px',
            height: '44px',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, #F06A05 0%, #FF8618 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
            </svg>
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h3 style={{ margin: '0 0 2px', fontSize: '14px', fontWeight: '600', color: '#1F140A' }}>{vendor.name}</h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px', color: '#7A6658' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 10V6a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v4"/><polyline points="17 14 12 19 7 14"/><line x1="12" y1="2" x2="12" y2="22"/>
                </svg>
                {vendor.walkTime}
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '3px', color: '#C87809' }}>
                <svg width="11" height="11" viewBox="0 0 24 24" fill="#C87809">
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                </svg>
                {vendor.rating.toFixed(1)} ({vendor.reviewCount} reviews)
              </span>
            </div>
          </div>
          <span style={{ fontSize: '12px', color: '#007A55', fontWeight: '600', background: '#E6F5ED', padding: '4px 10px', borderRadius: '20px' }}>
            {vendor.isOnline ? 'Open now' : 'Closed'}
          </span>
        </div>

        {/* Item Name & Rating */}
        <div style={{ marginBottom: '16px' }}>
          <h1 style={{ margin: '0 0 8px', fontSize: '24px', lineHeight: '32px', fontWeight: '700', color: '#1F140A', letterSpacing: '-0.5px' }}>
            {item.name}
          </h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
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

        {/* Description - Expandable */}
        <div style={{ marginBottom: '20px' }}>
          <p style={{ margin: '0 0 8px', fontSize: '14px', lineHeight: '22px', color: '#1F140A', display: showFullDescription ? 'block' : '-webkit-box', WebkitLineClamp: showFullDescription ? 'unset' : 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
            {item.description}
          </p>
          <button
            onClick={() => setShowFullDescription(!showFullDescription)}
            style={{ background: 'none', border: 'none', color: '#F06A05', fontSize: '13px', fontWeight: '600', cursor: 'pointer', padding: 0 }}
          >
            {showFullDescription ? 'Show less' : 'Show more'}
          </button>
        </div>

        {/* Portion Selector */}
        {item.portionSizes && item.portionSizes.length > 1 && (
          <div style={{ marginBottom: '20px' }}>
            <h4 style={{ margin: '0 0 12px', fontSize: '14px', fontWeight: '600', color: '#1F140A' }}>Select portion</h4>
            <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', scrollbarWidth: 'none', paddingBottom: '4px' }}>
              {item.portionSizes.map((portion: string, idx: number) => (
                <button
                  key={portion}
                  onClick={() => setSelectedPortion(portion)}
                  style={{
                    flex: '0 0 auto',
                    minWidth: '90px',
                    padding: '10px 16px',
                    borderRadius: '12px',
                    background: selectedPortion === portion ? '#FFF0E3' : 'white',
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

        {/* Price & Quantity */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', padding: '16px', background: 'white', borderRadius: '16px', border: '1px solid #F0E8E0' }}>
          <div>
            <span style={{ fontSize: '13px', color: '#7A6658', fontWeight: '500' }}>Price per portion</span>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginTop: '4px' }}>
              <strong style={{ fontSize: '28px', lineHeight: '36px', fontWeight: '700', fontVariantNumeric: 'tabular-nums', color: '#1F140A' }}>₹{item.price}</strong>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0', background: '#F5F1ED', borderRadius: '12px', border: '1px solid #E8ECEF' }}>
            <button
              onClick={decrement}
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
                borderRadius: '12px 0 0 12px',
                transition: 'all 150ms ease'
              }}
              aria-label="Decrease quantity"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
            </button>
            <span style={{ padding: '0 20px', fontSize: '18px', fontWeight: '600', fontVariantNumeric: 'tabular-nums', color: '#1F140A', minWidth: '32px', textAlign: 'center' }}>
              {quantity}
            </span>
            <button
              onClick={increment}
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
                borderRadius: '0 12px 12px 0',
                transition: 'all 150ms ease'
              }}
              aria-label="Increase quantity"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
            </button>
          </div>
        </div>

        {/* Tags/Highlights */}
        <div style={{ marginBottom: '20px' }}>
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

        {/* Reviews Section */}
        <div style={{ marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <h4 style={{ margin: 0, fontSize: '15px', fontWeight: '600', color: '#1F140A' }}>Reviews</h4>
            <button style={{ background: 'none', border: 'none', color: '#F06A05', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}>View all</button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {[
              { user: 'Priya S.', time: '2 days ago', rating: 5, text: 'Best biryani on campus! Perfect spice level and generous portion.' },
              { user: 'Arjun K.', time: '5 days ago', rating: 4, text: 'Good taste, but rice was a bit dry. Chicken was tender though.' },
              { user: 'Meera P.', time: '1 week ago', rating: 5, text: 'Ordered this 3 times this week. Consistently delicious!' }
            ].map((review, idx) => (
              <div key={idx} style={{ background: 'white', borderRadius: '12px', padding: '12px', border: '1px solid #F0E8E0' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                  <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'linear-gradient(135deg, #F06A05 0%, #FF8618 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '12px', fontWeight: '600' }}>
                    {review.user.charAt(0)}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '13px', fontWeight: '600', color: '#1F140A' }}>{review.user}</div>
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
          </div>
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
          <button
            onClick={() => {}}
            style={{
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
            }}
          >
            Add to Order
          </button>
        </div>
      </div>
    </div>
  );
}

export default FoodItemDetailVariantA;