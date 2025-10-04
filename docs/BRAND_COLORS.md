# HeySpender Brand Colors

This document contains the official brand color codes for HeySpender.

## Primary Brand Colors

| Color Name | Hex Code | Tailwind Class | Usage |
|------------|----------|----------------|-------|
| Purple Dark | `#723DC4` | `brand-purple-dark` | Primary brand color, backgrounds, headers |
| Orange | `#E98144` | `brand-orange` | Accent color, CTAs, highlights |
| Green | `#86E589` | `brand-green` | Success states, positive actions |
| Beige/Cream | `#F6D9AD` | `brand-beige` | Text on dark backgrounds, secondary elements |
| Salmon | `#EEA67F` | `brand-salmon` | Warm accent, alternative CTAs |
| Accent Red | `#E94B29` | `brand-accent-red` | Alert states, important actions |
| Pink Light | `#FFDDFF` | `brand-pink-light` | Soft accents, decorative elements |
| Cream Background | `#FDF4E8` | `brand-cream` | Page background color |

## Usage Guidelines

- **Primary Background**: Use `brand-purple-dark` for main backgrounds and headers
- **Text on Dark**: Use `brand-beige` for text on dark backgrounds
- **Primary Actions**: Use `brand-green` for main call-to-action buttons
- **Secondary Actions**: Use `brand-orange` for secondary buttons
- **Accents**: Use `brand-salmon` and `brand-accent-red` for highlights and alerts
- **Decorative**: Use `brand-pink-light` for subtle decorative elements

## Implementation

These colors are already configured in `tailwind.config.js` and can be used with the `brand-*` prefix classes.

Example:
```jsx
<div className="bg-brand-purple-dark text-brand-beige">
  <button className="bg-brand-green text-black">Primary Action</button>
  <button className="bg-brand-orange text-black">Secondary Action</button>
</div>
```

---

*Last updated: $(date)*
