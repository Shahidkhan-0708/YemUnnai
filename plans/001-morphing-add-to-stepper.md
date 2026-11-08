# 001 — Morphing ADD to Stepper State Transition

- **Status**: DONE
- **Commit**: fac6c1d
- **Severity**: HIGH
- **Category**: State indication & Preventing a jarring change
- **Estimated scope**: 3 files (`src/index.css`, `src/components/ItemCardPremium.tsx`, `src/components/ShopMenuItem.tsx`)

## Problem

When a student taps the `ADD` button on any food card in the menu, the item quantity increments from `0` to `1`. React instantly unmounts the `<button className="dish-add-action-btn">` and mounts `<div className="dish-stepper-active-row">` (in [`ItemCardPremium.tsx`](file:///C:/Users/HP/OneDrive/Documents/webd/task/YemEmUnnai/src/components/ItemCardPremium.tsx#L85-L117)) or `<div className="w-full bg-white ... flex items-center justify-between">` (in [`ShopMenuItem.tsx`](file:///C:/Users/HP/OneDrive/Documents/webd/task/YemEmUnnai/src/components/ShopMenuItem.tsx#L108-L143)).

Because this transition is an instantaneous conditional DOM replacement with zero enter animation, the button snaps harshly under the user's thumb. In `ItemCardPremium`, the visual contrast jumps from a white pill with green text to a solid emerald fill (`#257e3b`) in a single frame. Decrementing back to `0` similarly causes the stepper to disappear without any exit cushion.

Current code:

```tsx
/* src/components/ItemCardPremium.tsx:84-118 */
<div className="dish-stepper-anchor">
  {quantity === 0 ? (
    <button 
      type="button"
      className="dish-add-action-btn"
      onClick={(e) => {
        e.stopPropagation();
        if (isAvailable) addItem(normalizedMenuItem);
      }}
      disabled={!isAvailable}
    >
      {isAvailable ? 'ADD' : 'OUT'}
    </button>
  ) : (
    <div className="dish-stepper-active-row" onClick={(e) => e.stopPropagation()}>
      <button
        type="button"
        className="dish-step-mod decrement"
        onClick={() => removeItem(item.id)}
        aria-label={`Decrease ${item.name}`}
      >
        −
      </button>
      <span className="dish-step-count-val">{quantity}</span>
      <button
        type="button"
        className="dish-step-mod increment"
        onClick={() => addItem(normalizedMenuItem)}
        aria-label={`Increase ${item.name}`}
      >
        +
      </button>
    </div>
  )}
</div>
```

```css
/* src/index.css:2567-2584 */
.dish-add-action-btn,
.dish-stepper-active-row {
  width: 100%;
  height: 100%;
  background: #ffffff;
  border: 1px solid #e2e2e7;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  font-weight: 700;
  color: #257e3b;
  cursor: pointer;
  letter-spacing: 0.5px;
  transition: all 0.12s cubic-bezier(0.25, 0.46, 0.45, 0.94);
}
```

```tsx
/* src/components/ShopMenuItem.tsx:107-144 */
<div className="absolute -bottom-2.5 left-1/2 -translate-x-1/2 w-20 z-10">
  {quantity === 0 ? (
    <button 
      type="button"
      className="w-full bg-white text-emerald-600 border border-gray-200 shadow-sm text-[10px] font-black py-1.5 rounded-lg text-center uppercase tracking-wide hover:bg-gray-50 transition-all active:scale-95 cursor-pointer disabled:opacity-50 disabled:text-gray-400"
      onClick={(e) => {
        e.stopPropagation();
        if (isAvailable) addItem(normalizedMenuItem);
      }}
      disabled={!isAvailable}
    >
      {isAvailable ? 'ADD' : 'OUT'}
    </button>
  ) : (
    <div 
      className="w-full bg-white text-emerald-600 border border-gray-200 shadow-sm rounded-lg flex items-center justify-between px-2 py-1 text-xs font-black"
      onClick={(e) => e.stopPropagation()}
    >
      <button 
        type="button" 
        onClick={() => removeItem(item.id)}
        className="w-4 h-4 flex items-center justify-center text-gray-500 hover:text-emerald-700 active:scale-90 font-black cursor-pointer"
      >
        −
      </button>
      <span className="text-xs font-black text-emerald-700 font-mono">
        {quantity}
      </span>
      <button 
        type="button" 
        onClick={() => addItem(normalizedMenuItem)}
        className="w-4 h-4 flex items-center justify-center text-emerald-600 hover:text-emerald-800 active:scale-90 font-black cursor-pointer"
      >
        +
      </button>
    </div>
  )}
</div>
```

## Target

Establish a high-craft micro-spring state transition whenever `quantity` transitions between `0` and `> 0`, plus tactile feedback when incrementing/decrementing:

1. **Entrance Morph**: When the stepper container mounts, it scales up smoothly from `scale(0.92)` with `opacity: 0` to settled `scale(1)` with `opacity: 1` over `140ms` using the repo's primary easing `--ease-ui: cubic-bezier(.23, 1, .32, 1)`.
2. **Numeric Pulse**: When `quantity` changes (e.g. from `1` to `2`), the quantity number performs an imperceptible `120ms` micro-pop (`scale(1.15)` snapping back to `scale(1)`), reassuring the user that their tap registered.
3. **Reduced Motion**: Graceful degradation under `@media (prefers-reduced-motion: reduce)` — disable the scale transforms and run a simple `opacity 100ms ease` crossfade.

Target CSS to add to `src/index.css`:

```css
/* Stepper & ADD morph transitions */
@keyframes stepper-pop-enter {
  0% {
    opacity: 0;
    transform: scale(0.92);
  }
  100% {
    opacity: 1;
    transform: scale(1);
  }
}

@keyframes stepper-num-pulse {
  0% {
    transform: scale(1.18);
  }
  100% {
    transform: scale(1);
  }
}

.dish-stepper-enter {
  animation: stepper-pop-enter 140ms var(--ease-ui) both;
}

.dish-num-pulse {
  display: inline-block;
  animation: stepper-num-pulse 120ms var(--ease-ui) both;
}

@media (prefers-reduced-motion: reduce) {
  .dish-stepper-enter {
    animation: none;
    transition: opacity 100ms ease;
  }
  .dish-num-pulse {
    animation: none;
  }
}
```

## Repo Conventions to Follow

- Primary easing token: `--ease-ui: cubic-bezier(.23, 1, .32, 1);` defined in `src/index.css:50`.
- Button active states follow `active:scale-95` or `active:scale-[0.97]` with `120ms` duration.
- Exemplar: The cart badge micro-pop in [`FloatingCartBar.tsx:135-140`](file:///C:/Users/HP/OneDrive/Documents/webd/task/YemEmUnnai/src/components/FloatingCartBar.tsx#L135-L140) (`scale-115` on count change).

## Steps

### Step 1: Add Keyframe Animations to `src/index.css`
Append the `.dish-stepper-enter` and `.dish-num-pulse` animation rules and keyframes to `src/index.css` right after `.dish-step-count-val` (around line 2626), honoring the reduced-motion media query.

### Step 2: Attach Enter Class to `ItemCardPremium.tsx` Stepper
In [`src/components/ItemCardPremium.tsx`](file:///C:/Users/HP/OneDrive/Documents/webd/task/YemEmUnnai/src/components/ItemCardPremium.tsx#L85-L117):
- Add `dish-stepper-enter` to both the `<button className="dish-add-action-btn ...">` and the active stepper container `<div className="dish-stepper-active-row ...">`.
- Wrap the `{quantity}` count span with a dynamic key (`key={quantity}`) and class `dish-num-pulse` so each numeric change triggers the micro-pulse.

### Step 3: Mirror the Transition in `ShopMenuItem.tsx`
In [`src/components/ShopMenuItem.tsx`](file:///C:/Users/HP/OneDrive/Documents/webd/task/YemEmUnnai/src/components/ShopMenuItem.tsx#L108-L143):
- Add `dish-stepper-enter` to the `quantity === 0` button and the `quantity > 0` active container.
- Add `key={quantity}` and `dish-num-pulse` to `<span className="text-xs font-black text-emerald-700 font-mono">`.

## Boundaries

- Do NOT touch cart drawer checkout logic, cart context calculations, or price formatting.
- Do NOT alter layout geometry or bounding boxes (maintain existing `width`, `height`, and centered positioning).
- Do NOT add external dependencies (no framer-motion / extra libraries needed; pure lightweight CSS).

## Verification

- **Mechanical**:
  - `npx tsc -b` passes with zero errors.
  - `npm run lint` passes without new warnings.
- **Feel Check**:
  1. Open the home discovery menu on mobile / responsive view.
  2. Tap `ADD` on any dish card:
     - The button must not harshly snap from white to green; it enters with an organic `140ms` pop.
  3. Tap `+` to increase quantity:
     - The number smoothly pulses without shifting the neighboring `+` and `−` button baselines.
  4. In Chrome DevTools, open the **Animations** drawer, set playback speed to **10%**, and tap `ADD`:
     - Confirm the container smoothly scales from `0.92` to `1.00` while crossfading opacity.
  5. In Chrome DevTools **Rendering** tab, enable `Emulate CSS media feature prefers-reduced-motion: reduce`:
     - Confirm scale animations are completely suppressed, falling back cleanly to opacity transitions.
- **Done When**:
  - Tapping `ADD` and adjusting quantities feels tactile, fluid, and cohesive across both `ItemCardPremium` and `ShopMenuItem`.
