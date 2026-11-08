// Home Discovery - Variant D: Interaction Model
// Bottom sheet drawer pattern - progressive disclosure with contextual actions
// Swiggy/Toing inspired: expandable vendor bottom sheet, quick-add from list

import { useState } from 'react';
import { MOCK_VENDORS, MOCK_CATEGORIES, MOCK_FOOD_ITEMS, Vendor, FoodItem } from '../data/fixtures';

const ONLINE_VENDORS = MOCK_VENDORS.filter(v => v.isOnline);

export function HomeDiscoveryVariantD() {
  const [openVendorId, setOpenVendorId] = useState<string | null>(null);
  const [cartCount, setCartCount] = useState(2);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [savedItems, setSavedItems] = useState<string[]>([]);
  const [activeCategory, setActiveCategory] = useState('all');

  const toggleVendor = (vendorId: string) => {
    setOpenVendorId(prev => prev === vendorId ? null : vendorId);
  };

  const addToCart = (_item: FoodItem) => {
    setCartCount(c => c + 1);
    // Haptic feedback would trigger here
  };

  const toggleSave = (itemId: string) => {
    setSavedItems(prev => prev.includes(itemId)
      ? prev.filter(id => id !== itemId)
      : [...prev, itemId]);
  }
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const toggleSaveUnused = toggleSave;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const filteredItems = MOCK_FOOD_ITEMS.filter(item =>
    item.inStock && (activeCategory === 'all' || item.category === activeCategory)
  );

  return (
    <div className="discovery-screen" style={{ minHeight: '812px', width: '375px', margin: '0 auto', background: '#E8ECEF', position: 'relative', fontFamily: 'Plus Jakarta Sans, system-ui, sans-serif' }}>
      {/* Compact Sticky Header */}
      <header className="discovery-hero" style={{
        position: 'sticky',
        top: 0,
        zIndex: 50,
        height: '108px',
        padding: '14px 16px',
        color: '#FFFFFF',
        background: 'linear-gradient(135deg, #F06A05 0%, #D85800 100%)',
        borderRadius: '0 0 20px 20px'
      }}>
        <div className="discovery-brand-row" style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '10px',
          height: '40px',
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
              width: '40px',
              height: '40px',
              borderRadius: '12px',
              flexShrink: 0,
              background: 'rgba(255,255,255,0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backdropFilter: 'blur(8px)'
            }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
              </svg>
            </div>
            <div style={{ minWidth: 0 }}>
              <strong style={{
                display: 'block',
                fontSize: '17px',
                lineHeight: '22px',
                fontWeight: '700',
                letterSpacing: '1px'
              }}>YEMUNNAI</strong>
              <small style={{
                display: 'block',
                marginTop: '1px',
                fontSize: '10px',
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
            width: '40px',
            height: '40px',
            borderRadius: '12px',
            background: 'rgba(255,255,255,0.2)',
            color: '#FFF',
            border: 'none',
            backdropFilter: 'blur(8px)',
            cursor: 'pointer'
          }} aria-label={`Cart: ${cartCount} items`}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
            </svg>
            {cartCount > 0 && (
              <span style={{
                position: 'absolute',
                right: '-4px',
                top: '-4px',
                background: '#A23D00',
                color: '#FFFFFF',
                border: '2px solid #FFFFFF',
                borderRadius: '10px',
                minWidth: '18px',
                padding: '0 3px',
                fontSize: '9px',
                fontWeight: '600',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>{cartCount}</span>
            )}
          </button>
        </div>

        {/* Search + Category Switcher */}
        <div className="discovery-search-row" style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
          marginTop: '12px',
          position: 'relative',
          zIndex: 1
        }}>
          <div className="discovery-search" style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            flex: 1,
            minWidth: 0,
            height: '44px',
            padding: '0 12px',
            background: '#FFFFFF',
            borderRadius: '12px',
            color: '#746052',
            boxShadow: '0 3px 10px rgba(132, 53, 0, 0.1)'
          }}>
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, color: '#746052' }}>
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
                fontSize: '14px',
                lineHeight: '20px',
                fontWeight: '400',
                color: '#1F140A',
                outline: 'none'
              }}
              aria-label="Search food items"
            />
          </div>

          {/* Category Tabs - Scrollable */}
          <div className="discovery-categories" style={{
            display: 'flex',
            gap: '4px',
            padding: '2px',
            overflowX: 'auto',
            scrollbarWidth: 'none',
            scrollSnapType: 'x mandatory'
          }}>
            {MOCK_CATEGORIES.map((cat: Category) => (
              <button
                key={cat.id}
                style={{
                  flex: '0 0 auto',
                  scrollSnapAlign: 'start',
                  borderRadius: '22px',
                  color: activeCategory === cat.id ? 'white' : '#7A6658',
                  fontSize: '12px',
                  fontWeight: activeCategory === cat.id ? '600' : '500',
                  background: activeCategory === cat.id ? '#F06A05' : '#FFFFFF',
                  border: activeCategory === cat.id ? 'none' : '1px solid #F0E8E0',
                  cursor: 'pointer',
                  padding: '6px 14px',
                  boxShadow: activeCategory === cat.id ? '0 2px 8px rgba(240,106,5,0.3)' : '0 1px 3px rgba(31,20,10,0.06)',
                  transition: 'all 150ms cubic-bezier(.23,1,.32,1)',
                  whiteSpace: 'nowrap'
                }}
                aria-pressed={activeCategory === cat.id}
                onClick={() => setActiveCategory(cat.id)}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>
      </header>

      <div className="discovery-content" style={{ padding: '12px 12px 0', paddingBottom: '100px' }}>
        {/* Vendor List - Each expands into bottom sheet drawer */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {ONLINE_VENDORS.map((vendor: Vendor) => {
            const vendorItems = MOCK_FOOD_ITEMS.filter(item => item.vendorId === vendor.id && item.inStock);
            const isOpen = openVendorId === vendor.id;
            const topItems = vendorItems.slice(0, 3);

            return (
              <section key={vendor.id} className="vendor-section">
                {/* Vendor Card - Collapsed State */}
                <article className="vendor-card" style={{
                  background: '#FFFFFF',
                  border: '1px solid #D6DCE2',
                  borderRadius: '16px',
                  overflow: 'hidden',
                  boxShadow: '0 1px 3px rgba(31,20,10,0.05)',
                  transition: 'all 200ms cubic-bezier(.23,1,.32,1)'
                }}>
                  <button
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      padding: '14px 16px',
                      width: '100%',
                      background: 'transparent',
                      border: 'none',
                      cursor: 'pointer',
                      textAlign: 'left'
                    }}
                    onClick={() => toggleVendor(vendor.id)}
                    aria-expanded={isOpen}
                    aria-controls={`vendor-${vendor.id}-content`}
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
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
                        </svg>
                      </div>
                      <span style={{
                        position: 'absolute',
                        bottom: '2px',
                        right: '2px',
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
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <h3 style={{ margin: '0 0 4px', fontSize: '15px', lineHeight: '21px', fontWeight: '600', letterSpacing: '-0.2px' }}>
                        {vendor.name}
                      </h3>
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
                          {vendor.rating.toFixed(1)}
                        </span>
                        <span style={{ color: '#D6DCE2' }}>•</span>
                        <span>{vendor.categories.slice(0, 2).join(', ')}</span>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{
                        fontSize: '13px',
                        fontWeight: '600',
                        fontVariantNumeric: 'tabular-nums',
                        color: '#1F140A'
                      }}>{vendorItems.length} items</span>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#7A6658" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{
                        transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                        transition: 'transform 200ms cubic-bezier(.23,1,.32,1)'
                      }}>
                        <polyline points="6 9 12 15 18 9"/>
                      </svg>
                    </div>
                  </button>

                  {/* Expandable Drawer Content */}
                  <div
                    id={`vendor-${vendor.id}-content`}
                    style={{
                      maxHeight: isOpen ? '380px' : '0',
                      opacity: isOpen ? 1 : 0,
                      overflow: 'hidden',
                      transition: 'max-height 300ms cubic-bezier(.23,1,.32,1), opacity 200ms ease',
                      background: '#F8F9FA',
                      borderTop: isOpen ? '1px solid #F0E8E0' : 'none'
                    }}
                  >
                    {isOpen && (
                      <div style={{ padding: '12px 16px 16px' }}>
                        {/* Quick Add Section - Top 3 items */}
                        <div style={{ marginBottom: '12px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                            <span style={{ fontSize: '11px', fontWeight: '600', color: '#7A6658', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Popular picks</span>
                            <span style={{ fontSize: '11px', color: '#F06A05', fontWeight: '500' }}>{vendorItems.length} items total</span>
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            {topItems.map((item: FoodItem) => (
                              <article key={item.id} className="vendor-item" style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '12px',
                                padding: '10px',
                                background: '#FFFFFF',
                                borderRadius: '12px',
                                border: '1px solid #F0E8E0',
                                transition: 'all 150ms ease'
                              }}>
                                <div style={{
                                  position: 'relative',
                                  width: '56px',
                                  height: '56px',
                                  borderRadius: '10px',
                                  flexShrink: 0,
                                  overflow: 'hidden',
                                  background: item.dietary === 'veg' ? '#E6F5ED' : item.dietary === 'nonveg' ? '#FCEAE4' : '#F5F1ED'
                                }}>
                                  <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    width: '100%',
                                    height: '100%'
                                  }}>
                                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={item.dietary === 'veg' ? '#007A55' : '#F06A05'} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                      <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
                                    </svg>
                                  </div>
                                </div>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '3px' }}>
                                    <h4 style={{ margin: 0, fontSize: '13.5px', lineHeight: '19px', fontWeight: '600', maxWidth: '100%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                      {item.name}
                                    </h4>
                                    <span className={`dietary-badge`} data-diet={item.dietary} style={{
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: '4px',
                                      fontSize: '9.5px',
                                      lineHeight: '14px',
                                      fontWeight: '600',
                                      color: item.dietary === 'veg' ? '#006B49' : item.dietary === 'nonveg' ? '#9A3C13' : '#6F6258',
                                      padding: '2px 7px',
                                      borderRadius: '5px',
                                      background: item.dietary === 'veg' ? '#E6F5ED' : item.dietary === 'nonveg' ? '#FCEAE4' : '#F5F1ED'
                                    }}>
                                      <span className="dietary-symbol" style={{
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        width: '10px',
                                        height: '10px',
                                        border: `1px solid ${item.dietary === 'veg' ? '#007A55' : item.dietary === 'nonveg' ? '#B45309' : '#6F6258'}`,
                                        borderRadius: '2px',
                                        flexShrink: 0
                                      }}>
                                        {item.dietary === 'veg' ? (
                                          <i style={{ width: '4px', height: '4px', background: '#007A55', borderRadius: '50%' }} />
                                        ) : item.dietary === 'nonveg' ? (
                                          <i style={{ width: '0', height: '0', borderLeft: '2.5px solid transparent', borderRight: '2.5px solid transparent', borderBottom: '4px solid #9A3C13', borderRadius: '0', background: 'none' }} />
                                        ) : (
                                          <i style={{ width: '4px', height: '4px', background: '#6F6258', borderRadius: '50%' }} />
                                        )}
                                      </span>
                                      <span style={{ textTransform: 'capitalize', fontSize: '9px' }}>{item.dietary}</span>
                                    </span>
                                  </div>
                                  <p style={{ margin: 0, fontSize: '11px', color: '#7A6658', lineHeight: '15px', maxWidth: '100%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                    {item.category === 'cooked' ? 'Hot & fresh' : item.category === 'snack' ? 'Crispy snack' : item.category === 'drink' ? 'Refreshing' : 'Sweet treat'}
                                  </p>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                                  <div style={{ textAlign: 'right' }}>
                                    <div style={{ fontSize: '16px', lineHeight: '20px', fontWeight: '600', fontVariantNumeric: 'tabular-nums', color: '#1F140A' }}>
                                      ₹{item.price}
                                    </div>
                                    {item.portionSizes && item.portionSizes.length > 1 && (
                                      <span style={{ fontSize: '9.5px', color: '#7A6658' }}>{item.portionSizes.length} sizes</span>
                                    )}
                                  </div>
                                  <button
                                    onClick={(e) => { e.stopPropagation(); addToCart(item); }}
                                    style={{
                                      width: '36px',
                                      height: '36px',
                                      borderRadius: '10px',
                                      background: '#F06A05',
                                      color: 'white',
                                      border: 'none',
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      cursor: 'pointer',
                                      boxShadow: '0 2px 6px rgba(240,106,5,0.3)',
                                      transition: 'transform 120ms cubic-bezier(.23,1,.32,1), box-shadow 150ms ease'
                                    }}
                                    aria-label={`Add ${item.name} to order`}
                                  >
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                      <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                                    </svg>
                                  </button>
                                </div>
                              </article>
                            ))}
                          </div>
                        </div>

                        {/* View All Button */}
                        <button
                          onClick={(e) => { e.stopPropagation(); }}
                          style={{
                            width: '100%',
                            padding: '14px',
                            borderRadius: '12px',
                            background: 'linear-gradient(135deg, #FFF0E3 0%, #FFF8F0 100%)',
                            color: '#A23D00',
                            border: '1px solid #FFE3CB',
                            fontSize: '13px',
                            fontWeight: '600',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '8px',
                            transition: 'all 150ms ease'
                          }}
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="6 9 12 15 18 9"/>
                          </svg>
                          View all {vendorItems.length} items from {vendor.name}
                        </button>
                      </div>
                    )}
                  </div>
                </article>
              </section>
            );
          })}
        </div>
      </div>

      {/* Bottom Cart Bar - Floating */}
      {cartCount > 0 && (
        <div style={{
          position: 'fixed',
          bottom: '90px',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 100,
          width: 'calc(100% - 24px)',
          maxWidth: '375px',
          pointerEvents: 'none'
        }}>
          <div style={{
            pointerEvents: 'auto',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
            padding: '14px 16px',
            background: '#FFFFFF',
            borderRadius: '16px',
            boxShadow: '0 8px 32px rgba(31,20,10,0.15)',
            border: '1px solid #F0E8E0'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#F06A05" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
              </svg>
              <div>
                <div style={{ fontSize: '13px', fontWeight: '600', color: '#1F140A' }}>{cartCount} item{cartCount !== 1 ? 's' : ''} in cart</div>
                <div style={{ fontSize: '11px', color: '#7A6658' }}>Tap to view order</div>
              </div>
            </div>
            <button style={{
              padding: '10px 20px',
              borderRadius: '10px',
              background: '#F06A05',
              color: 'white',
              border: 'none',
              fontSize: '13px',
              fontWeight: '600',
              cursor: 'pointer',
              boxShadow: '0 3px 10px rgba(240,106,5,0.3)',
              transition: 'transform 120ms ease'
            }}>
              Checkout
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default HomeDiscoveryVariantD;