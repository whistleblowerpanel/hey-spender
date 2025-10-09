# Wallet Page - Visual Design Guide

## Page Layout Overview

```
┌─────────────────────────────────────────────────────────────┐
│  Navbar (Fixed Top)                                         │
│  [HeySpender Logo]    [Explore] [Wallet] [Profile Menu] ▼  │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                     WALLET PAGE                              │
│                                                              │
│  ← Back to Dashboard                      [🔄 Refresh] [⬇️ Export]
│                                                              │
│  Wallet                                                      │
│  Manage your earnings and transactions                       │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  💰 Available Balance                    ⭕  ⭕      │  │
│  │  Your current wallet balance              ⭕         │  │
│  │                                                      │  │
│  │  ₦ 125,000                                          │  │
│  │  ════════                                            │  │
│  │                                                      │  │
│  │  [⬆️ Request Payout]  [💳 Bank Details]            │  │
│  │            ⭕                                         │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
│  ┌────────────────┐ ┌────────────────┐ ┌────────────────┐ │
│  │ Total Received │ │   Total Sent   │ │Pending Payouts │ │
│  │   📈           │ │      📉        │ │      ⏰        │ │
│  │  ₦ 250,000    │ │   ₦ 75,000    │ │   ₦ 50,000    │ │
│  │  15 trans.     │ │   8 trans.     │ │  Processing    │ │
│  └────────────────┘ └────────────────┘ └────────────────┘ │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  📋 Transaction History                              │  │
│  │  25 transactions found                               │  │
│  │                                                      │  │
│  │  [🔍 Search...]                         [✕ Clear]   │  │
│  │                                                      │  │
│  │  [All] [Received] [Sent]  ← Tabs                   │  │
│  │                                                      │  │
│  │  [All Time ▼] [All Types ▼] [All Status ▼]        │  │
│  │                                                      │  │
│  │  ┌────────────────────────────────────────────────┐│  │
│  │  │ Date         Description        Amount  Status ││  │
│  │  ├────────────────────────────────────────────────┤│  │
│  │  │ Oct 8, 2025  Gift contribution  +₦5,000  ✓    ││  │
│  │  │ 14:23        @john_doe                        ││  │
│  │  ├────────────────────────────────────────────────┤│  │
│  │  │ Oct 7, 2025  Payout request     -₦50,000 ⏰   ││  │
│  │  │ 09:15        Processing                        ││  │
│  │  ├────────────────────────────────────────────────┤│  │
│  │  │ Oct 6, 2025  Cash goal contrib  +₦10,000 ✓    ││  │
│  │  │ 16:45        @jane_smith                       ││  │
│  │  └────────────────────────────────────────────────┘│  │
│  │                                                      │  │
│  │  Showing 1 to 10 of 25                              │  │
│  │  [← Previous] [1] [2] [3] [4] [5] [Next →]        │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

## Mobile View (< 640px)

```
┌──────────────────────────┐
│  Navbar (Compact)        │
│  [☰] HeySpender [👤]   │
└──────────────────────────┘

┌──────────────────────────┐
│  ← Back to Dashboard     │
│                          │
│  Wallet                  │
│  Manage your earnings    │
│  [🔄] [⬇️]              │
│                          │
│  ┌────────────────────┐ │
│  │💰 Available Balance│ │
│  │                    │ │
│  │  ₦ 125,000        │ │
│  │                    │ │
│  │ [Request Payout]   │ │
│  │ [Bank Details]     │ │
│  └────────────────────┘ │
│                          │
│  ┌────────────────────┐ │
│  │ Total Received     │ │
│  │  📈 ₦ 250,000     │ │
│  │  15 transactions   │ │
│  └────────────────────┘ │
│                          │
│  ┌────────────────────┐ │
│  │ Total Sent         │ │
│  │  📉 ₦ 75,000      │ │
│  │  8 transactions    │ │
│  └────────────────────┘ │
│                          │
│  ┌────────────────────┐ │
│  │ Pending Payouts    │ │
│  │  ⏰ ₦ 50,000      │ │
│  │  Processing        │ │
│  └────────────────────┘ │
│                          │
│  📋 Transaction History  │
│  25 transactions         │
│                          │
│  [🔍 Search...]         │
│                          │
│  [All][Received][Sent]   │
│                          │
│  [All Time ▼]           │
│  [All Types ▼]          │
│  [All Status ▼]         │
│                          │
│  ┌────────────────────┐ │
│  │ 🎁 Gift contribution│ │
│  │ Oct 8, 2025 · 14:23│ │
│  │ +₦5,000           │ │
│  │ [Credit] [✓] @john │ │
│  └────────────────────┘ │
│                          │
│  ┌────────────────────┐ │
│  │ ⬆️ Payout request  │ │
│  │ Oct 7, 2025 · 09:15│ │
│  │ -₦50,000          │ │
│  │ [Debit] [⏰] Pending│ │
│  └────────────────────┘ │
│                          │
│  [← Previous] [Next →]  │
└──────────────────────────┘
```

## Modal Designs

### 1. Request Payout Modal

```
┌─────────────────────────────────────┐
│  ⬆️ Request Payout               ✕  │
│  Request a withdrawal from your      │
│  wallet balance                      │
│                                      │
│  ┌─────────────────────────────────┐│
│  │ ℹ️ Available balance: ₦125,000 ││
│  └─────────────────────────────────┘│
│                                      │
│  Amount (₦)                         │
│  ┌─────────────────────────────────┐│
│  │ [Enter amount]                  ││
│  └─────────────────────────────────┘│
│  Minimum payout amount is ₦1,000    │
│                                      │
│  [Cancel]        [Submit Request]   │
└─────────────────────────────────────┘
```

### 2. Bank Details Modal

```
┌─────────────────────────────────────┐
│  💳 Bank Account Details         ✕  │
│  Add or update your bank account    │
│  for payouts                         │
│                                      │
│  Account Name                        │
│  ┌─────────────────────────────────┐│
│  │ [Full name on account]          ││
│  └─────────────────────────────────┘│
│                                      │
│  Account Number                      │
│  ┌─────────────────────────────────┐│
│  │ [10-digit account number]       ││
│  └─────────────────────────────────┘│
│                                      │
│  Bank Name                           │
│  ┌─────────────────────────────────┐│
│  │ [Select your bank ▼]            ││
│  └─────────────────────────────────┘│
│                                      │
│  [Cancel]          [Save Details]   │
└─────────────────────────────────────┘
```

### 3. Export Modal

```
┌─────────────────────────────────────┐
│  ⬇️ Export Transactions          ✕  │
│  Download your transaction history  │
│                                      │
│  ┌─────────────────────────────────┐│
│  │ Total Transactions:    25       ││
│  │ Date Range:      All Time       ││
│  │ Format:          JSON           ││
│  └─────────────────────────────────┘│
│                                      │
│  [Cancel]         [⬇️ Download]    │
└─────────────────────────────────────┘
```

## Color Palette Used

```
Wallet Balance Card
├── Background: Linear gradient
│   ├── from-brand-purple (#8B5CF6)
│   ├── via-brand-purple-dark (#7C3AED)
│   └── to-purple-900 (#581C87)
├── Text: White (#FFFFFF)
└── Decorative: White with 10% & 5% opacity

Transaction Types
├── Credit (Received)
│   ├── Icon background: Green-100 (#DCFCE7)
│   ├── Icon color: Green-600 (#16A34A)
│   └── Amount: Green-600 (#16A34A)
│
└── Debit (Sent)
    ├── Icon background: Red-100 (#FEE2E2)
    ├── Icon color: Red-600 (#DC2626)
    └── Amount: Red-600 (#DC2626)

Status Badges
├── Success: Default variant (Green)
├── Pending: Secondary variant (Yellow)
└── Failed: Destructive variant (Red)

Background
├── Main: Gray-50 (#F9FAFB)
├── Cards: White (#FFFFFF)
└── Hover: Gray-50 (#F9FAFB)
```

## Iconography

```
Primary Icons
│
├── 💰 Wallet → Balance card
├── 📈 TrendingUp → Total Received
├── 📉 TrendingDown → Total Sent
├── ⏰ Clock → Pending
├── 📋 History → Transaction list
├── 🔍 Search → Search input
├── 🎁 Gift → Contribution transactions
├── ⬆️ Send → Sent transactions
├── ⬇️ ArrowDownLeft → Credit transactions
├── ⬆️ ArrowUpRight → Debit transactions
├── ✓ CheckCircle2 → Success status
├── ⏰ Clock → Pending status
├── ⚠️ AlertCircle → Failed/Warning status
├── 💳 CreditCard → Bank details
├── 👤 User → User/contributor
├── 🔄 RefreshCcw → Refresh button
├── ⬇️ Download → Export button
├── ✕ X → Clear/Close
├── ← ArrowLeft → Back navigation
└── ChevronLeft/Right → Pagination
```

## Typography Hierarchy

```
┌─────────────────────────────────────┐
│                                     │
│  Wallet  ← H1: 3xl/4xl, Bold       │
│  Manage your earnings  ← Body: base │
│                                     │
│  ┌───────────────────────────────┐ │
│  │ Available Balance  ← Card Title│ │
│  │ text-sm, medium                │ │
│  │                                │ │
│  │ ₦ 125,000  ← Display: 5xl,    │ │
│  │            font-bold           │ │
│  └───────────────────────────────┘ │
│                                     │
│  Transaction History  ← H2: xl, Bold│
│  25 transactions found ← Small: sm │
│                                     │
│  Oct 8, 2025  ← Body: sm          │
│  14:23  ← Metadata: xs, gray-400   │
│                                     │
└─────────────────────────────────────┘
```

## Responsive Grid System

### Desktop (lg+)
```
Statistics Cards: 3 columns
┌──────────┬──────────┬──────────┐
│ Received │   Sent   │ Pending  │
└──────────┴──────────┴──────────┘

Transaction Table: Full width
┌────────────────────────────────────┐
│  Date  │ Desc │ Type │ User │ Amt │
└────────────────────────────────────┘
```

### Tablet (md)
```
Statistics Cards: 2 columns
┌──────────┬──────────┐
│ Received │   Sent   │
├──────────┴──────────┤
│      Pending        │
└─────────────────────┘

Transaction Table: Scrollable
```

### Mobile (sm)
```
Statistics Cards: 1 column
┌─────────────────────┐
│      Received       │
├─────────────────────┤
│        Sent         │
├─────────────────────┤
│      Pending        │
└─────────────────────┘

Transaction Cards: Stack
┌─────────────────────┐
│   Transaction 1     │
├─────────────────────┤
│   Transaction 2     │
├─────────────────────┤
│   Transaction 3     │
└─────────────────────┘
```

## Animation Details

### Page Load
```
Skeleton screens → Fade in content
Duration: 300ms
Easing: ease-out
```

### Transaction List
```
Stagger animation
Each item delays: 50ms
Initial: opacity 0, y: 20
Animate: opacity 1, y: 0
```

### Hover States
```
Cards: Shadow increase
Buttons: Background darken
Table rows: Background gray-50
Duration: 200ms
```

### Modal Transitions
```
Backdrop: Fade in
Content: Scale + Fade
Duration: 200ms
Easing: ease-out
```

## Accessibility Features

### Keyboard Navigation
- Tab through all interactive elements
- Enter/Space to activate buttons
- Escape to close modals

### Screen Readers
- Descriptive ARIA labels
- Status announcements
- Clear heading hierarchy

### Visual Indicators
- Focus outlines on interactive elements
- Color + icon for status (not color alone)
- Sufficient color contrast (WCAG AA)

## Performance Optimizations

### Rendering
- `useMemo` for filtered transactions
- `useMemo` for statistics calculations
- Conditional rendering for empty states

### Network
- Real-time subscriptions for updates
- Efficient pagination (10 items/page)
- Debounced search input (future)

### Assets
- Lucide icons (tree-shakeable)
- No external images
- Optimized animations

---

**Design System Consistency**

All components use the HeySpender brand design system:
- Brand colors (purple, green, orange, salmon)
- Border style: 2px solid black
- Rounded corners: default radius
- Shadow: elevation when needed
- Font: System font stack

The wallet page seamlessly integrates with the existing design language while providing a fresh, modern interface for financial management.

