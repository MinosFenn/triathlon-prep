# Light Mode Implementation

## Overview

The triathlon training app now supports both light and dark themes, allowing users to choose their preferred viewing experience. The theme system is built with React Context, CSS variables, and localStorage persistence.

## Features

### Theme Switching
- **Toggle Button**: Located in the main header next to the week selector
- **Icons**: Sun icon for light mode, moon icon for dark mode
- **Smooth Transitions**: All theme changes animate smoothly (0.3s ease)

### Persistence
- Theme preference is saved to `localStorage` under the key `triathlon-theme`
- Theme persists across page reloads and browser sessions
- First-time visitors see a theme based on their system preference

### Design Principles

#### Dark Mode (Default)
- Deep navy/black backgrounds with gradient overlays
- Purple, cyan, and indigo accent gradients
- White/light text for high contrast
- Glassmorphism with white overlays (0.06-0.1 opacity)

#### Light Mode
- Clean white/light gray backgrounds
- Subtle gradient overlays with reduced opacity
- Dark text for excellent readability
- Glassmorphism with white overlays (0.5-0.85 opacity)
- Softer shadows and borders

## Technical Architecture

### Files Modified/Created

1. **`src/contexts/ThemeContext.tsx`** (new)
   - React Context for global theme state
   - Theme persistence logic
   - System preference detection

2. **`src/components/ui/ThemeToggle.tsx`** (new)
   - Toggle button component
   - Sun/moon icons
   - Accessibility labels

3. **`src/app/globals.css`** (modified)
   - CSS variables for theme colors
   - Theme-specific styles using `[data-theme]` attribute
   - Utility classes for theme-aware text colors

4. **`src/app/layout.tsx`** (modified)
   - Wrapped app with `ThemeProvider`

5. **`src/components/triathlon/TriathlonWeeklyPlan.tsx`** (modified)
   - Added `ThemeToggle` to header

### CSS Variables

```css
/* Light Mode */
--bg-primary: #ffffff
--bg-secondary: #f8fafc
--text-primary: #0f172a
--text-secondary: #475569
--text-tertiary: #94a3b8

/* Dark Mode */
--bg-primary: #0b0f1a
--bg-secondary: #111827
--text-primary: #e2e8f0
--text-secondary: #94a3b8
--text-tertiary: #64748b
```

### Theme Application

The theme is applied via a `data-theme` attribute on the root `<html>` element:

```html
<html data-theme="light">  <!-- or "dark" -->
```

All theme-specific styles use this selector:

```css
[data-theme="light"] .glass-card {
  background: rgba(255, 255, 255, 0.7);
}

[data-theme="dark"] .glass-card {
  background: rgba(255, 255, 255, 0.06);
}
```

## Usage

### For Users

Click the sun/moon icon in the top-right corner of the app header to toggle between themes.

### For Developers

#### Using the Theme Context

```tsx
import { useTheme } from "@/contexts/ThemeContext";

function MyComponent() {
  const { theme, toggleTheme, setTheme } = useTheme();
  
  return (
    <div>
      <p>Current theme: {theme}</p>
      <button onClick={toggleTheme}>Toggle Theme</button>
      <button onClick={() => setTheme("light")}>Light Mode</button>
      <button onClick={() => setTheme("dark")}>Dark Mode</button>
    </div>
  );
}
```

#### Adding Theme-Aware Styles

**Option 1: CSS Variables**
```css
.my-component {
  color: var(--text-primary);
  background: var(--bg-secondary);
}
```

**Option 2: Data Attribute Selectors**
```css
[data-theme="light"] .my-component {
  /* Light mode styles */
}

[data-theme="dark"] .my-component {
  /* Dark mode styles */
}
```

**Option 3: Utility Classes**
```tsx
<div className="text-theme-primary bg-theme-secondary">
  Content adapts to theme
</div>
```

## Compatibility

- ✅ Next.js 15.x
- ✅ React 19.x
- ✅ Server-side rendering (SSR)
- ✅ Static site generation (SSG)
- ✅ All modern browsers
- ✅ Mobile responsive

## Future Enhancements

Potential improvements for the theme system:

1. **Additional Themes**: Add more color schemes (e.g., high contrast, custom themes)
2. **Auto Theme Switching**: Automatically switch based on time of day
3. **Settings Page**: Dedicated theme settings in the parameters page
4. **Custom Accent Colors**: Allow users to customize accent colors
5. **Theme Presets**: Predefined theme combinations for different use cases

## Related Files

- `src/app/globals.css` - Theme styles and CSS variables
- `src/contexts/ThemeContext.tsx` - Theme state management
- `src/components/ui/ThemeToggle.tsx` - Toggle component
- `src/app/layout.tsx` - Theme provider integration

## References

- [CSS Variables (MDN)](https://developer.mozilla.org/en-US/docs/Web/CSS/Using_CSS_custom_properties)
- [React Context API](https://react.dev/reference/react/useContext)
- [Next.js Theming](https://nextjs.org/docs/app/building-your-application/styling/css-in-js)
