# Brockmann Font Setup for Mobile

This document explains how the Brockmann font is configured to work reliably on mobile devices.

## Implementation Strategy

The font is loaded using a **multi-layered approach** to ensure maximum compatibility and reliability:

### 1. Inline @font-face Declarations (index.html)
- Font declarations are embedded directly in the HTML `<head>` with `font-display: block`
- This ensures the font is defined immediately, before any external resources load
- Prevents FOUC (Flash of Unstyled Content) on mobile

### 2. Local Font CSS File (public/fonts/brockmann.css)
- Serves as a backup and keeps fonts organized
- Uses direct CDN URLs to Fontshare's font files
- Loaded early in the HTML head

### 3. CSS Import (src/index.css)
- Imports the local font CSS at the top of the stylesheet
- Provides triple redundancy

### 4. Universal Font Enforcement
- Uses `* { font-family: 'Brockmann' !important; }` to override all other font declarations
- Specifically targets form elements (input, textarea, select, button)
- Includes pseudo-elements (::before, ::after)

### 5. Mobile-Specific Optimizations
- `font-display: block` - Blocks text rendering until font loads (prevents font flash)
- `-webkit-text-size-adjust: 100%` - Prevents iOS from adjusting font sizes
- `font-smoothing` properties for better rendering on retina displays
- DNS prefetch and preconnect for faster font loading

## Font Files

- **Regular (400)**: `https://cdn.fontshare.com/wf/QDTWOSQYDMDILBMCSP7FKN3LMBYGQDJ6/H7C63V2HZKMXHPNIPQF3IJFNVWXGR5FN/XURWSWWQ4NRFJ2GWFR6FZGFG5AGYBXB6.woff2`
- **Bold (700)**: `https://cdn.fontshare.com/wf/D7BTFVQYWG2KR726JDUXHM4L4KL5FU3O/H7C63V2HZKMXHPNIPQF3IJFNVWXGR5FN/D7LWPXJ6RBIFZTNQ2NVVUYBV2GT5JTWV.woff2`

## Fallback Chain

`'Brockmann', 'Poppins', -apple-system, BlinkMacSystemFont, sans-serif`

1. **Brockmann** - Primary brand font
2. **Poppins** - Loaded from Google Fonts as backup
3. **-apple-system** - iOS system font
4. **BlinkMacSystemFont** - macOS system font
5. **sans-serif** - Generic fallback

## Files Modified

1. `index.html` - Added inline font declarations and enforcement
2. `src/index.css` - Added font import and universal enforcement
3. `public/fonts/brockmann.css` - Created font definition file
4. `tailwind.config.js` - Updated font family configuration

## Testing on Mobile

When testing via IP address on your phone:

1. **Hard refresh** the page (clear cache)
2. Check browser DevTools > Network tab to verify font files are loading
3. Check browser DevTools > Console for any font loading errors
4. Use "Inspect Element" to verify font-family is applied

## Troubleshooting

If fonts still don't load:

1. Check that your dev server allows access from your local network
2. Verify the CDN URLs are accessible from your phone's browser
3. Clear your mobile browser cache completely
4. Try in an incognito/private browsing window
5. Check for any Content Security Policy (CSP) issues in browser console

## Why This Approach?

- **Inline declarations**: Fastest possible font loading
- **Multiple sources**: Redundancy ensures font loads from somewhere
- **!important flags**: Override any conflicting CSS from libraries
- **font-display: block**: Prevents font flash, maintains brand consistency
- **Universal selector**: Catches all elements, including dynamically created ones

