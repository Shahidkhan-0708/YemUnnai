// Home Discovery - Variant A: Information Hierarchy Focus
// Restructures content hierarchy with clear visual levels
// Primary action: Browse & order food
// Uses project's existing design tokens from index.css


import { MOCK_VENDORS, MOCK_CATEGORIES, MOCK_FOOD_ITEMS } from '../data/fixtures';

const DISPLAY_ITEMS = MOCK_FOOD_ITEMS.slice(0, 8);
const ONLINE_VENDORS = MOCK_VENDORS.filter(v => v.isOnline);

export function HomeDiscoveryVariantA() {
  return (
    <div className="discovery-screen" style={{ minHeight: '812px', width: '375px', margin: '0 auto', background: '#E8ECEF', position: 'relative', fontFamily: 'Plus Jakarta Sans, system-ui, sans-serif' }}>
      {/* Hero Section - Highest Hierarchy */}
      <header className="discovery-hero" style={{
        position: 'relative',
        height: '176px',
        padding: '24px 20px',
        color: '#FFFFFF',
        background: 'linear-gradient(135deg, #F06A05 0%, #D85800 100%)',
        borderRadius: '0 0 24px 24px'
      }}>
        {/* Background pattern */}
        <div className="discovery-hero-background" style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          pointerEvents: 'none',
          backgroundImage: 'radial-gradient(circle at 80% 20%, rgba(255,255,255,0.15) 0%, transparent 50%)'
        }} />

        {/* Brand Row - Level 1: Identity */}
        <div className="discovery-brand-row" style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px',
          height: '44px',
          position: 'relative',
          zIndex: 1
        }}>
          <div className="discovery-brand" style={{
            display: 'flex',
            alignItems: 'center',
            gap: '13px',
            minWidth: 0,
            textAlign: 'left',
            background: 'transparent',
            border: 'none',
            padding: 0,
            height: '44px'
          }}>
            <div style={{
              width: '44px',
              height: '44px',
              borderRadius: '13px',
              flexShrink: 0,
              background: 'rgba(255,255,255,0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backdropFilter: 'blur(8px)'
            }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
              </svg>
            </div>
            <div style={{ minWidth: 0 }}>
              <strong style={{
                display: 'block',
                fontSize: '20px',
                lineHeight: '26px',
                fontWeight: '700',
                letterSpacing: '1.4px'
              }}>YEMUNNAI</strong>
              <small style={{
                display: 'block',
                marginTop: '1px',
                fontSize: '11.5px',
                lineHeight: '17px',
                fontWeight: '600',
                color: '#FFF7EF',
                whiteSpace: 'nowrap'
              }}>Food between lectures</small>
            </div>
          </div>

          {/* Cart - Level 2: Primary Action */}
          <button className="discovery-cart" style={{
            display: 'grid',
            placeItems: 'center',
            position: 'relative',
            flexShrink: 0,
            width: '44px',
            height: '44px',
            padding: 0,
            border: 'none',
            borderRadius: '14px',
            background: 'rgba(255,255,255,0.2)',
            color: '#FFF',
            backdropFilter: 'blur(8px)',
            transition: 'background-color 150ms ease, transform 120ms cubic-bezier(.23,1,.32,1)',
            cursor: 'pointer'
          }} aria-label="Cart: 2 items">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ transform: 'translateY(1px)' }}>
              <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
            </svg>
            <span style={{
              position: 'absolute',
              right: '-5px',
              top: '-5px',
              background: '#A23D00',
              color: '#FFFFFF',
              border: '2px solid #FFFFFF',
              borderRadius: '12px',
              minWidth: '20px',
              padding: '1px 4px',
              fontSize: '10px',
              fontWeight: '600',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>2</span>
          </button>
        </div>

        {/* Search - Level 3: Discovery Entry Point */}
        <div className="discovery-search-row" style={{
          display: 'flex',
          marginTop: '28px',
          position: 'relative',
          zIndex: 1
        }}>
          <div className="discovery-search" style={{
            display: 'flex',
            alignItems: 'center',
            gap: '9px',
            flex: 1,
            minWidth: 0,
            height: '56px',
            padding: '0 16px',
            background: '#FFFFFF',
            borderRadius: '18px',
            color: '#746052',
            boxShadow: '0 5px 16px rgba(132, 53, 0, 0.13)',
            transition: 'box-shadow 150ms ease, outline 150ms ease'
          }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, color: '#746052' }}>
              <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
            </svg>
            <input
              type="search"
              placeholder="Search samosa, dosa, biryani..."
              style={{
                flex: 1,
                width: 0,
                minWidth: 0,
                border: 'none',
                background: 'transparent',
                fontFamily: 'inherit',
                fontSize: '16px',
                lineHeight: '24px',
                fontWeight: '400',
                color: '#1F140A',
                outline: 'none'
              }}
              aria-label="Search food items"
            />
          </div>
        </div>
      </header>

      {/* Canteen Panel - Level 2: Vendor Selection */}
      <div className="discovery-canteen-panel" style={{ padding: '8px 20px 2px' }}>
        <div className="discovery-shops-heading" style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          minHeight: '32px'
        }}>
          <h2 style={{ margin: 0, fontSize: '18px', lineHeight: '24px', fontWeight: '700', letterSpacing: '-0.35px' }}>
            Canteens nearby
          </h2>
          <button style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-start',
            position: 'relative',
            width: '78px',
            minHeight: '32px',
            padding: '0 12px',
            borderRadius: '12px',
            background: '#FFF0E3',
            color: '#A23D00',
            fontSize: '12px',
            lineHeight: '18px',
            fontWeight: '600',
            whiteSpace: 'nowrap',
            border: 'none',
            cursor: 'pointer'
          }}>
            All
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ position: 'absolute', right: '5px', transform: 'translateY(-1px)' }}>
              <polyline points="6 9 12 15 18 9"/>
            </svg>
          </button>
        </div>

        <div className="discovery-shops" style={{
          display: 'flex',
          gap: '7px',
          margin: '9px -4px 0',
          padding: '5px 0 0',
          overflowX: 'auto',
          overflowY: 'hidden',
          scrollbarWidth: 'none',
          WebkitOverflowScrolling: 'touch'
        }}>
          {ONLINE_VENDORS.map((vendor: Vendor) => (
            <button
              key={vendor.id}
              className="discovery-shop"
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                flex: '0 0 calc((100% - 28px)/5)',
                minWidth: '66px',
                minHeight: '102px',
                gap: '10px',
                padding: 0,
                border: 'none',
                background: 'transparent',
                cursor: 'pointer'
              }}
              aria-label={`${vendor.name}, ${vendor.walkTime}, ${vendor.rating} stars`}
            >
              <div className="discovery-shop-photo" style={{
                position: 'relative',
                display: 'block',
                width: '56px',
                height: '56px',
                borderRadius: '18px',
                flexShrink: 0,
                background: 'linear-gradient(135deg, #FFE8D6 0%, #FFF8F1 100%)'
              }}>
                <div style={{
                  display: 'flex',
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  borderRadius: '18px',
                  background: 'linear-gradient(135deg, #F06A05 0%, #FF8618 100%)',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
                  </svg>
                </div>
                <div style={{
                  content: '""',
                  position: 'absolute',
                  inset: 0,
                  border: '1px solid rgba(0,0,0,0.1)',
                  borderRadius: '18px',
                  pointerEvents: 'none'
                }} />
                {/* Online indicator */}
                <div style={{
                  position: 'absolute',
                  bottom: '-2px',
                  right: '-2px',
                  width: '16px',
                  height: '16px',
                  borderRadius: '50%',
                  background: '#007A55',
                  border: '2px solid #FFF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                </div>
              </div>
              <span className="discovery-shop-name" style={{
                display: 'block',
                color: '#1F140A',
                fontSize: '12px',
                lineHeight: '18px',
                fontWeight: '600',
                textAlign: 'center',
                maxWidth: '66px',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
              }}>{vendor.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Content - Level 3: Food Grid */}
      <div className="discovery-content" style={{ padding: '18px 16px 0' }}>
        {/* Category Pills - Level 3a: Filter */}
        <div className="discovery-categories" style={{
          display: 'flex',
          gap: '4px',
          padding: '4px',
          height: '42px',
          margin: '16px 4px 24px',
          borderRadius: '12px',
          background: '#D6DCE2'
        }}>
          {MOCK_CATEGORIES.map((cat: Category) => (
            <button
              key={cat.id}
              style={{
                flex: 1,
                borderRadius: '9px',
                color: cat.id === 'all' ? 'white' : '#7A6658',
                fontSize: '12px',
                fontWeight: cat.id === 'all' ? '500' : '400',
                background: cat.id === 'all' ? '#F06A05' : 'transparent',
                border: 'none',
                cursor: 'pointer',
                padding: '0 12px',
                transition: 'all 150ms ease'
              }}
              aria-pressed={cat.id === 'all'}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {/* Food Grid - Level 3b: Primary Content */}
        <div className="food-grid" style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
          gap: '16px'
        }}>
          {DISPLAY_ITEMS.map((item: FoodItem) => (
            <article
              key={item.id}
              className="food-card"
              style={{
                display: 'flex',
                flexDirection: 'column',
                padding: '10px',
                minWidth: 0,
                border: '1px solid #D6DCE2',
                borderRadius: '18px',
                background: 'white',
                transition: 'transform 120ms cubic-bezier(.23,1,.32,1), box-shadow 150ms ease'
              }}
            >
              {/* Photo - Visual hierarchy top */}
              <div className="food-photo" style={{
                position: 'relative',
                width: '100%',
                aspectRatio: '156/138',
                borderRadius: '11px',
                overflow: 'hidden',
                background: '#E8ECEF'
              }}>
                <div style={{
                  position: 'absolute',
                  inset: 0,
                  width: '100%',
                  height: '100%',
                  background: `linear-gradient(135deg, #${item.dietary === 'veg' ? 'E6F5ED' : 'FCEAE4'} 0%, #FFF 100%)`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke={item.dietary === 'veg' ? '#007A55' : '#F06A05'} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
                  </svg>
                </div>

                {/* Save button - tertiary action */}
                <button
                  className="food-save"
                  style={{
                    position: 'absolute !important',
                    right: '8px',
                    top: '8px',
                    width: '25px !important',
                    height: '25px !important',
                    padding: '0 !important',
                    borderRadius: '8px !important',
                    background: 'white !important',
                    color: '#1F140A !important',
                    border: '0 !important',
                    boxShadow: '0 2px 8px rgba(31,20,10,0.12) !important',
                    fontSize: '0 !important',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer'
                  }}
                  aria-label={item.dietary === 'veg' ? 'Save vegetarian item' : 'Save non-vegetarian item'}
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
                  </svg>
                </button>

                {/* Dietary badge - visual indicator */}
                <span className={`dietary-badge`} data-diet={item.dietary} style={{
                  position: 'absolute',
                  left: '8px',
                  top: '8px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '5px',
                  maxWidth: '100%',
                  fontSize: '11px',
                  lineHeight: '16px',
                  fontWeight: '600',
                  color: item.dietary === 'veg' ? '#006B49' : item.dietary === 'nonveg' ? '#9A3C13' : '#6F6258',
                  padding: '4px 8px',
                  borderRadius: '6px',
                  background: item.dietary === 'veg' ? '#E6F5ED' : item.dietary === 'nonveg' ? '#FCEAE4' : '#F5F1ED'
                }}>
                  <span className="dietary-symbol" style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '12px',
                    height: '12px',
                    border: `1px solid ${item.dietary === 'veg' ? '#007A55' : item.dietary === 'nonveg' ? '#B45309' : '#6F6258'}`,
                    borderRadius: '2px',
                    flexShrink: 0
                  }}>
                    {item.dietary === 'veg' ? (
                      <i style={{ width: '5px', height: '5px', background: '#007A55', borderRadius: '50%' }} />
                    ) : item.dietary === 'nonveg' ? (
                      <i style={{ width: '0', height: '0', borderLeft: '3px solid transparent', borderRight: '3px solid transparent', borderBottom: '5px solid #9A3C13', borderRadius: '0', background: 'none' }} />
                    ) : (
                      <i style={{ width: '5px', height: '5px', background: '#6F6258', borderRadius: '50%' }} />
                    )}
                  </span>
                  <span style={{ textTransform: 'capitalize' }}>{item.dietary}</span>
                </span>
              </div>

              {/* Name & Vendor - Level 4: Identity */}
              <div className="food-name-row" style={{
                display: 'flex',
                alignItems: 'flexStart',
                gap: '6px',
                height: '36px',
                flexShrink: 0,
                margin: '12px 2px 0'
              }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <h3 style={{
                    display: '-webkit-box',
                    WebkitBoxOrient: 'vertical',
                    WebkitLineClamp: 2,
                    overflow: 'hidden',
                    minWidth: 0,
                    margin: 0,
                    fontSize: '12.5px',
                    lineHeight: '17px',
                    fontWeight: '600',
                    overflowWrap: 'anywhere'
                  }}>{item.name}</h3>
                  <p className="food-vendor" style={{ margin: '0 2px 5px', fontSize: '10px', lineHeight: '14px', color: '#7A6658', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {item.vendor}
                  </p>
                </div>
              </div>

              {/* Price & Action - Level 5: Primary CTA */}
              <div className="food-price-row" style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '4px',
                minHeight: '24px',
                margin: '0 2px'
              }}>
                <div className="menu-price-variants" style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '4px',
                  minWidth: 0,
                  fontSize: '14px',
                  lineHeight: '20px'
                }}>
                  <span style={{ display: 'flex', alignItems: 'baseline', flexWrap: 'wrap', gap: '7px' }}>
                    <strong style={{ fontSize: '19px', lineHeight: '24px', fontWeight: '600', fontVariantNumeric: 'tabular-nums' }}>₹{item.price}</strong>
                    {item.portionSizes && item.portionSizes.length > 1 && (
                      <small style={{ fontSize: '11px', fontWeight: '400', color: '#7A6658' }}>+{item.portionSizes.length - 1} sizes</small>
                    )}
                  </span>
                </div>
                <button
                  className="food-action"
                  style={{
                    width: '100%',
                    height: '36px !important',
                    minHeight: '36px !important',
                    padding: '0 6px !important',
                    marginTop: '0',
                    borderRadius: '9px !important',
                    fontSize: '11.5px !important',
                    fontWeight: '500 !important',
                    background: '#F06A05',
                    color: 'white',
                    border: 'none',
                    cursor: 'pointer',
                    transition: 'background-color 150ms ease, transform 120ms cubic-bezier(.23,1,.32,1)'
                  }}
                >
                  Order
                </button>
              </div>

              {/* Rating & Social - Level 6: Social Proof */}
              <div className="food-social" style={{
                display: 'flex',
                justifyContent: 'space-between',
                margin: '6px 2px',
                color: '#7A6658',
                fontSize: '9.5px'
              }}>
                <div className="food-rating" style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '3px',
                  flexShrink: 0,
                  minHeight: '24px',
                  lineHeight: '16px',
                  fontVariantNumeric: 'tabular-nums',
                  color: '#C87809'
                }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="#C87809">
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                  </svg>
                  <span>{item.rating.toFixed(1)}</span>
                  <small style={{ color: '#7A6658' }}>({item.reviews})</small>
                </div>
                <button style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: 0,
                  fontSize: '9.5px',
                  minHeight: '16px',
                  background: 'transparent',
                  border: 'none',
                  color: '#7A6658',
                  cursor: 'pointer'
                }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                  </svg>
                  <span>{item.likes}</span>
                </button>
              </div>
            </article>
          ))}
        </div>
      </div>
    </div>
  );
}

export default HomeDiscoveryVariantA;