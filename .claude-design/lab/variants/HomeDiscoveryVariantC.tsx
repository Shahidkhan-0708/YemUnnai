// Home Discovery - Variant C: Density Variation (Compact)
// More information visible, tighter spacing - tradeoff: more visible data vs easier scanning

import React from 'react';
import { MOCK_VENDORS, MOCK_CATEGORIES, MOCK_FOOD_ITEMS, Vendor, FoodItem, Category } from '../data/fixtures';

const DISPLAY_ITEMS = MOCK_FOOD_ITEMS.slice(0, 10); // Show more items
const ONLINE_VENDORS = MOCK_VENDORS.filter(v => v.isOnline);

export function HomeDiscoveryVariantC() {
  return (
    <div className="discovery-screen" style={{ minHeight: '812px', width: '375px', margin: '0 auto', background: '#E8ECEF', position: 'relative', fontFamily: 'Plus Jakarta Sans, system-ui, sans-serif' }}>
      {/* Ultra-Compact Hero */}
      <header className="discovery-hero" style={{
        position: 'relative',
        height: '112px',
        padding: '14px 16px',
        color: '#FFFFFF',
        background: 'linear-gradient(135deg, #F06A05 0%, #D85800 100%)',
        borderRadius: '0 0 20px 20px'
      }}>
        <div className="discovery-hero-background" style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: 'radial-gradient(circle at 80% 20%, rgba(255,255,255,0.12) 0%, transparent 50%)'
        }} />

        <div className="discovery-brand-row" style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '10px',
          height: '36px',
          position: 'relative',
          zIndex: 1
        }}>
          <div className="discovery-brand" style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            minWidth: 0
          }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              flexShrink: 0,
              background: 'rgba(255,255,255,0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backdropFilter: 'blur(8px)'
            }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
              </svg>
            </div>
            <div style={{ minWidth: 0 }}>
              <strong style={{
                display: 'block',
                fontSize: '16px',
                lineHeight: '20px',
                fontWeight: '700',
                letterSpacing: '1px'
              }}>YEMUNNAI</strong>
              <small style={{
                display: 'block',
                marginTop: '1px',
                fontSize: '9.5px',
                lineHeight: '14px',
                fontWeight: '600',
                color: '#FFF7EF'
              }}>Food between lectures</small>
            </div>
          </div>

          <button className="discovery-cart" style={{
            display: 'grid',
            placeItems: 'center',
            position: 'relative',
            flexShrink: 0,
            width: '36px',
            height: '36px',
            borderRadius: '10px',
            background: 'rgba(255,255,255,0.2)',
            color: '#FFF',
            border: 'none',
            backdropFilter: 'blur(8px)',
            cursor: 'pointer'
          }} aria-label="Cart: 2 items">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
            </svg>
            <span style={{
              position: 'absolute',
              right: '-3px',
              top: '-3px',
              background: '#A23D00',
              color: '#FFFFFF',
              border: '2px solid #FFFFFF',
              borderRadius: '9px',
              minWidth: '16px',
              padding: '0 2px',
              fontSize: '8px',
              fontWeight: '600',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>2</span>
          </button>
        </div>

        {/* Compact Search */}
        <div className="discovery-search-row" style={{
          display: 'flex',
          marginTop: '10px',
          position: 'relative',
          zIndex: 1
        }}>
          <div className="discovery-search" style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            flex: 1,
            minWidth: 0,
            height: '42px',
            padding: '0 12px',
            background: '#FFFFFF',
            borderRadius: '12px',
            color: '#746052',
            boxShadow: '0 3px 10px rgba(132, 53, 0, 0.1)'
          }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, color: '#746052' }}>
              <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
            </svg>
            <input
              type="search"
              placeholder="Search food..."
              style={{
                flex: 1,
                width: 0,
                minWidth: 0,
                border: 'none',
                background: 'transparent',
                fontFamily: 'inherit',
                fontSize: '14px',
                lineHeight: '20px',
                fontWeight: '400',
                color: '#1F140A',
                outline: 'none'
              }}
              aria-label="Search food items"
            />
          </div>
        </div>
      </header>

      <div className="discovery-content" style={{ padding: '12px 12px 0', paddingBottom: '100px' }}>
        {/* Inline Vendor Picker - Compact */}
        <div className="discovery-canteen-panel" style={{ padding: '0 4px 8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflowX: 'auto', scrollbarWidth: 'none', paddingBottom: '4px' }}>
            {ONLINE_VENDORS.map((vendor: Vendor) => (
              <button
                key={vendor.id}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  flex: '0 0 auto',
                  minWidth: '60px',
                  gap: '6px',
                  padding: 0,
                  border: 'none',
                  background: 'transparent',
                  cursor: 'pointer'
                }}
                aria-label={`${vendor.name}, ${vendor.walkTime}`}
              >
                <div style={{
                  position: 'relative',
                  width: '48px',
                  height: '48px',
                  borderRadius: '14px',
                  flexShrink: 0,
                  overflow: 'hidden',
                  background: 'linear-gradient(135deg, #F06A05 0%, #FF8618 100%)'
                }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '100%',
                    height: '100%'
                  }}>
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
                    </svg>
                  </div>
                  <span style={{
                    position: 'absolute',
                    bottom: '1px',
                    right: '1px',
                    width: '12px',
                    height: '12px',
                    borderRadius: '50%',
                    background: '#007A55',
                    border: '2px solid #FFF',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <svg width="6" height="6" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                  </span>
                </div>
                <span style={{
                  display: 'block',
                  color: '#1F140A',
                  fontSize: '10.5px',
                  lineHeight: '14px',
                  fontWeight: '600',
                  textAlign: 'center',
                  maxWidth: '60px',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap'
                }}>{vendor.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Compact Category Pills */}
        <div className="discovery-categories" style={{
          display: 'flex',
          gap: '3px',
          padding: '3px',
          height: '34px',
          margin: '8px 2px 16px',
          borderRadius: '10px',
          background: '#D6DCE2'
        }}>
          {MOCK_CATEGORIES.slice(0, 6).map((cat: Category) => (
            <button
              key={cat.id}
              style={{
                flex: 1,
                borderRadius: '7px',
                color: cat.id === 'all' ? 'white' : '#7A6658',
                fontSize: '10.5px',
                fontWeight: cat.id === 'all' ? '500' : '400',
                background: cat.id === 'all' ? '#F06A05' : 'transparent',
                border: 'none',
                cursor: 'pointer',
                padding: '0 8px',
                transition: 'all 150ms ease'
              }}
              aria-pressed={cat.id === 'all'}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {/* Dense Food Grid - 2 columns, smaller cards */}
        <div className="food-grid" style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
          gap: '10px'
        }}>
          {DISPLAY_ITEMS.map((item: FoodItem) => (
            <article
              key={item.id}
              className="food-card"
              style={{
                display: 'flex',
                flexDirection: 'column',
                padding: '8px',
                minWidth: 0,
                border: '1px solid #D6DCE2',
                borderRadius: '14px',
                background: 'white'
              }}
            >
              {/* Smaller Photo */}
              <div className="food-photo" style={{
                position: 'relative',
                width: '100%',
                aspectRatio: '1/1',
                borderRadius: '9px',
                overflow: 'hidden',
                background: '#E8ECEF'
              }}>
                <div style={{
                  position: 'absolute',
                  inset: 0,
                  width: '100%',
                  height: '100%',
                  background: item.dietary === 'veg' ? '#E6F5ED' : item.dietary === 'nonveg' ? '#FCEAE4' : '#F5F1ED',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke={item.dietary === 'veg' ? '#007A55' : '#F06A05'} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
                  </svg>
                </div>

                {/* Save button */}
                <button
                  className="food-save"
                  style={{
                    position: 'absolute !important',
                    right: '5px',
                    top: '5px',
                    width: '20px !important',
                    height: '20px !important',
                    padding: '0 !important',
                    borderRadius: '6px !important',
                    background: 'white !important',
                    color: '#1F140A !important',
                    border: '0 !important',
                    boxShadow: '0 1px 4px rgba(31,20,10,0.1) !important',
                    fontSize: '0 !important',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer'
                  }}
                  aria-label="Save item"
                >
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
                  </svg>
                </button>

                {/* Dietary badge - smaller */}
                <span className={`dietary-badge`} data-diet={item.dietary} style={{
                  position: 'absolute',
                  left: '5px',
                  top: '5px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '3px',
                  fontSize: '8.5px',
                  lineHeight: '12px',
                  fontWeight: '600',
                  color: item.dietary === 'veg' ? '#006B49' : item.dietary === 'nonveg' ? '#9A3C13' : '#6F6258',
                  padding: '2px 6px',
                  borderRadius: '4px',
                  background: item.dietary === 'veg' ? '#E6F5ED' : item.dietary === 'nonveg' ? '#FCEAE4' : '#F5F1ED'
                }}>
                  <span className="dietary-symbol" style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '9px',
                    height: '9px',
                    border: `1px solid ${item.dietary === 'veg' ? '#007A55' : item.dietary === 'nonveg' ? '#B45309' : '#6F6258'}`,
                    borderRadius: '2px',
                    flexShrink: 0
                  }}>
                    {item.dietary === 'veg' ? (
                      <i style={{ width: '4px', height: '4px', background: '#007A55', borderRadius: '50%' }} />
                    ) : item.dietary === 'nonveg' ? (
                      <i style={{ width: '0', height: '0', borderLeft: '2px solid transparent', borderRight: '2px solid transparent', borderBottom: '3.5px solid #9A3C13', borderRadius: '0', background: 'none' }} />
                    ) : (
                      <i style={{ width: '4px', height: '4px', background: '#6F6258', borderRadius: '50%' }} />
                    )}
                  </span>
                  <span style={{ textTransform: 'capitalize', fontSize: '7.5px' }}>{item.dietary}</span>
                </span>
              </div>

              {/* Compact Name & Vendor */}
              <div className="food-name-row" style={{
                display: 'flex',
                alignItems: 'flexStart',
                gap: '4px',
                height: '30px',
                flexShrink: 0,
                margin: '8px 1px 0'
              }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <h3 style={{
                    display: '-webkit-box',
                    WebkitBoxOrient: 'vertical',
                    WebkitLineClamp: 2,
                    overflow: 'hidden',
                    minWidth: 0,
                    margin: 0,
                    fontSize: '11px',
                    lineHeight: '15px',
                    fontWeight: '600',
                    overflowWrap: 'anywhere'
                  }}>{item.name}</h3>
                  <p className="food-vendor" style={{ margin: '0 1px 3px', fontSize: '8.5px', lineHeight: '12px', color: '#7A6658', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {item.vendor}
                  </p>
                </div>
              </div>

              {/* Compact Price & Action */}
              <div className="food-price-row" style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '4px',
                minHeight: '20px',
                margin: '0 1px'
              }}>
                <div className="menu-price-variants" style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '2px',
                  minWidth: 0,
                  fontSize: '12px',
                  lineHeight: '17px'
                }}>
                  <span style={{ display: 'flex', alignItems: 'baseline', flexWrap: 'wrap', gap: '5px' }}>
                    <strong style={{ fontSize: '16px', lineHeight: '20px', fontWeight: '600', fontVariantNumeric: 'tabular-nums' }}>₹{item.price}</strong>
                    {item.portionSizes && item.portionSizes.length > 1 && (
                      <small style={{ fontSize: '9.5px', fontWeight: '400', color: '#7A6658' }}>+{item.portionSizes.length - 1}</small>
                    )}
                  </span>
                </div>
                <button
                  className="food-action"
                  style={{
                    width: '100%',
                    height: '30px !important',
                    minHeight: '30px !important',
                    padding: '0 4px !important',
                    marginTop: '0',
                    borderRadius: '7px !important',
                    fontSize: '10px !important',
                    fontWeight: '500 !important',
                    background: '#F06A05',
                    color: 'white',
                    border: 'none',
                    cursor: 'pointer'
                  }}
                >
                  Add
                </button>
              </div>

              {/* Minimal Rating */}
              <div className="food-social" style={{
                display: 'flex',
                justifyContent: 'space-between',
                margin: '4px 1px',
                color: '#7A6658',
                fontSize: '8px'
              }}>
                <div className="food-rating" style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '2px',
                  flexShrink: 0,
                  minHeight: '16px',
                  lineHeight: '14px',
                  fontVariantNumeric: 'tabular-nums',
                  color: '#C87809'
                }}>
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="#C87809">
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                  </svg>
                  <span>{item.rating.toFixed(1)}</span>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </div>
  );
}

export default HomeDiscoveryVariantC;