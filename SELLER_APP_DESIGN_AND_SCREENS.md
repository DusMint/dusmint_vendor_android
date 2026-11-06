# DusMint Seller (Vendor) App - Comprehensive Architecture, Screens & Typography Guide

> **Target Audience:** AI Engineering Assistants (Claude / GPT), Product Designers, and React Native Developers.  
> **Repository:** `dusmint_vendor_android`  
> **Runtime Stack:** Expo SDK 54 • React Native 0.81.5 • React 19.1.0 • React Navigation 6 • TypeScript (Strict) • Fastify Backend API

---

## 1. Executive Summary & Operational Architecture

DusMint Seller (Vendor / Partner) App is a dedicated merchant operations terminal engineered for local mandi shop owners, vegetable traders, dairy owners, and meat merchants. 

Unlike consumer e-commerce apps, the vendor app is an **operational workhorse tool** designed for high-stress, fast-paced packing workflows where orders must be weighed, packaged in eco-bags, sealed with tamper-proof security tape, and handed over to delivery riders within **3 to 4 minutes**.

### High-Level Navigation Architecture
The navigation tree is configured in `App.tsx`:
```
RootStack (Native Stack)
├── Tabs (BottomTabNavigator)
│   ├── VendorOrders (VendorOrdersScreen - live order processing pipeline)
│   ├── VendorStock (VendorStockScreen - inventory toggle & mandi price check)
│   └── VendorEarnings (VendorEarningsScreen - T+0 settlements & ledger)
└── VendorPack (VendorPackScreen - BLE scale reading & tamper seal verification)
```

---

## 2. Complete Screen Directory & Trigger Matrix

Total Core Screens: **4 Operational Screens**

| # | Screen Name | File Path | Route Key | Trigger / How It Is Triggered | Transition |
|---|---|---|---|---|---|
| 1 | **Orders Pipeline** | `src/screens/orders/VendorOrdersScreen.tsx` | `Tabs > VendorOrders` | Default launch screen (`initialRouteName="VendorOrders"`) | Tab Switch |
| 2 | **Menu & Stock** | `src/screens/stock/VendorStockScreen.tsx` | `Tabs > VendorStock` | Bottom tab tap on "Menu & Stock" | Tab Switch |
| 3 | **Earnings & Payouts**| `src/screens/earnings/VendorEarningsScreen.tsx` | `Tabs > VendorEarnings` | Bottom tab tap on "Earnings" | Tab Switch |
| 4 | **Pack & Weigh Scale** | `src/screens/orders/VendorPackScreen.tsx` | `VendorPack` | Tapping "⚖️ Pack & Weigh on Scale" button on any pending order | Native Stack Push |

---

## 3. Screen-by-Screen Component & Content Inventory

### 3.1 VendorOrdersScreen (`VendorOrdersScreen.tsx`) - Hero Operations Dashboard
- **How Triggered:** Primary tab on app startup.
- **Visual Components:**
  1. **Dukaan Header Strip:**
     - Store avatar box with 24-hr shop badge (`🏪`)
     - Store name (`Mandi Fresh Sabzi`) in bold Metropolis typography
     - Multi-tenant Dukaan switcher pill (`⇄ Switch`) allowing merchant to switch between multiple assigned shops
     - Live cluster subtitle (`Vegetables Dukaan • Vijay Nagar`) with green pulsing status dot
     - Shop Open / Closed toggle capsule with animated Switch
  2. **Segmented Order Status Tabs:**
     - Horizontal capsule bar with 4 segment tabs:
       - `New` (with attention-grabbing red alert badge counter)
       - `Packing` (active packing orders count)
       - `Ready` (sealed & waiting for rider pickup)
       - `Done` (handed over or delivered)
     - Active tab has vibrant brand orange background (`#FC6011`), white text, and subtle elevation shadow.
  3. **Hero Order Card:**
     - Elevated pure white card surface (`borderRadius: 18`, subtle border, soft ambient drop shadow)
     - Order ID chip: `ORDER #DM-20261102-YPYV`
     - Delivery slot: `🕒 07:00 - 10:00 AM • Morning Slot`
     - Status Badge:
       - When New: `⚡ ACTION REQUIRED` (amber badge)
       - When Packing: `📦 IN PACKING` (blue badge)
       - When Ready: `✓ SEALED & READY` (emerald badge)
     - Items to Pack Checklist Box:
       - Quantity chip: `[ 1x ]` in brand orange
       - Item Title: `Fresh Desi Tomato`
       - Pack Unit: `1 kg`
       - Item Price: `₹35`
     - Payout & Economics Strip:
       - Left: Customer Subtotal (`₹35`)
       - Right: Your Net Payout in bold emerald green (`₹32 • Instant T+0`)
     - Tamper-Proof Seal Code Strip (displayed when order is ready): Serial barcode display (`#DST-49201-INDR`)
     - Operational Action Buttons:
       - `⚠️ Item Short`: Alerts customer service of out-of-stock items
       - `⚖️ Pack & Weigh on Scale`: Launches the digital scale packing flow
  4. **Empty State Card:**
     - Circular icon container with box emoji (`📦`), friendly header (`No new orders right now`), and background order polling notice.
- **Audio & Haptic Feedback:**
  - Auto-polls backend every 6 seconds.
  - Triggers phone vibration pattern `[0, 500, 200, 500]` and alert chime when a new customer order arrives.

---

### 3.2 VendorPackScreen (`VendorPackScreen.tsx`) - Scale, Weigh & Seal Verification
- **How Triggered:** Tapping "Pack & Weigh on Scale" from the order card.
- **Visual Components:**
  1. **Top Header:**
     - Back arrow navigation button
     - Page Title: `Pack & Verify Order`
     - Subtitle: Order Code (`DM-20261102-YPYV`)
  2. **Step 1: Digital Scale BLE Live Reading Card:**
     - BLE Connection Status Pill (`🟢 Scale BLE Active`)
     - Huge Digital Weight Display: Large bold green LED-style readout (`2040 GRAMS`)
     - Scale Tare & Quick Adjust Controls:
       - `- 100g` button
       - `+ 100g` button
       - `Tare 2,000g` button
     - Weight Tolerance Indicator: `Target: ~2,000 g • Variation: ±2.0% within tolerance`
  3. **Step 2: Packing Proof Camera Card:**
     - Dashed photo container with camera icon
     - Turns solid green with checkmark (`✅ Scale Photo Captured`) upon snapping photo
  4. **Step 3: Tamper-Proof Seal Tape Card:**
     - Serialized barcode / QR scanner trigger
     - Turns green when green tape seal serial (`DST-58291-INDR`) is scanned and linked to order
  5. **Floating Bottom Action Bar:**
     - High-converting full-width button: `Ready for Rider Pickup →`
     - Inset-padded to float safely above Android navigation bar

---

### 3.3 VendorStockScreen (`VendorStockScreen.tsx`) - Inventory & Mandi Rates
- **How Triggered:** Tapping "Menu & Stock" bottom tab.
- **Visual Components:**
  1. **Top Header:**
     - Title: `Daily Stock & Mandi Rates`
     - Subtitle: `Toggle in-stock items and check real-time availability for customers`
  2. **Inventory Item Cards:**
     - English Item Title: `Fresh Desi Tomato (Hybrid)`
     - Hindi Vernacular Name: `देसी टमाटर`
     - Category & Unit: `Category: Vegetables • Unit: 1 kg`
     - Mandi Price Band Chip: `Govt Mandi Band: ₹30 - ₹40`
     - Price in bold primary orange (`₹35`) + strikethrough MRP (`₹45`)
     - In-Stock / Out-of-Stock Status Pill & Switch toggle
     - Out-of-stock items automatically dim with `opacity: 0.65`

---

### 3.4 VendorEarningsScreen (`VendorEarningsScreen.tsx`) - T+0 Daily Settlements
- **How Triggered:** Tapping "Earnings" bottom tab.
- **Visual Components:**
  1. **Top Header:**
     - Title: `Earnings & Settlements`
     - Subtitle: `Same-day settlement on customer delivery confirmation`
  2. **Today's Net Earnings Hero Card:**
     - Deep dark navy background (`#0F172A`) with rounded corners (`20px`) and elevation
     - Green badge: `TODAY'S NET EARNINGS (T+0)`
     - Huge Rupee display: `₹220.50`
     - Breakdown subtext: `Gross: ₹245.00 • Platform Commission: -₹24.50 (10%)`
     - 3-Column Metrics Row:
       - `₹14,850` (This Week)
       - `99.2%` (Fill Rate)
       - `4.9 ★` (Vendor Score)
  3. **Linked Bank & UPI Card:**
     - Title + `VERIFIED ✅` emerald badge
     - Merchant UPI VPA: `ramesh.sharma@okaxis`
     - Automated settlement batch schedule description (`Daily 09:30 PM Batch`)
  4. **Recent Settlements Ledger List:**
     - Payout date (`Yesterday`, `28 Oct`)
     - Net credited amount (`₹5,120.00`)
     - Status tag: `✓ Credited (Ref: UPI-98412)`
     - "Download Invoice ›" link

---

## 4. Typography Scale & Font Hierarchy

### Current Font Setup
The app officially loads **Metropolis** fonts via `expo-font` in `App.tsx`:
- `Metropolis-Regular` (400)
- `Metropolis-Medium` (500)
- `Metropolis-SemiBold` (600)
- `Metropolis-Bold` (700)
- `Metropolis-ExtraBold` (800)

---

### Disciplined 5-Tier Operational Type Scale

In a warehouse / store setting where the vendor needs to read orders from 2-3 feet away on a counter or weighing stand, **typography must prioritize numeric clarity, high contrast, and zero ambiguity**.

```
┌────────────────────────────────────────────────────────────────────────┐
│ TIER 1: METRIC DISPLAY (36px - 44px • ExtraBold 800)                   │
│ Usage: Digital Scale live weight (2040 GRAMS), Daily Payout (₹220.50)  │
├────────────────────────────────────────────────────────────────────────┤
│ TIER 2: SCREEN TITLE / H1 (20px • Bold 700 • LineHeight: 26px)         │
│ Usage: Screen titles ("Daily Stock & Mandi Rates", "Earnings")         │
├────────────────────────────────────────────────────────────────────────┤
│ TIER 3: CARD HEADING / H2 (16px • Bold 700 • LineHeight: 22px)         │
│ Usage: Dukaan Name ("Mandi Fresh Sabzi"), Order Code, Item Names       │
├────────────────────────────────────────────────────────────────────────┤
│ TIER 4: BODY / OPERATIONAL TEXT (13px - 14px • Medium 500)             │
│ Usage: Items list, Slot info, Button CTAs, Bank descriptions           │
├────────────────────────────────────────────────────────────────────────┤
│ TIER 5: STATUS PILL / MICRO BADGE (10px - 11px • Bold 700)             │
│ Usage: "ACTION REQUIRED", "SEALED & READY", "OPEN/CLOSED", Qty "1x"    │
└────────────────────────────────────────────────────────────────────────┘
```

#### Detailed Specification Table

| Level | Size (`fontSize`) | Weight (`fontWeight`) | Font Family | Line Height | Usage in Seller App |
|---|---|---|---|---|---|
| **Metric Display** | `44px` | `900` / `800` | `Metropolis-Bold` | `48px` | Live scale weight readout on dark background |
| **Hero Rupee** | `34px` | `800` (ExtraBold) | `Metropolis-Bold` | `38px` | Today's Net Earnings on dark navy card |
| **Screen Title** | `20px` | `800` (Bold) | `Metropolis-Bold` | `26px` | Screen Top Titles |
| **Card Heading** | `16px` | `700` (Bold) | `Metropolis-Bold` | `22px` | Shop Name, Order ID `#DM-20261102-YPYV` |
| **Body Primary** | `13px` - `14px`| `600` / `700` | `Metropolis-Medium` | `18px` | Item names, Item prices, Button labels |
| **Body Secondary**| `12px` | `500` (Medium) | `Metropolis-Regular`| `16px` | Cluster info, Hindi translations, Mandi rates |
| **Micro Badge** | `10px` - `11px`| `800` (Bold) | `Metropolis-Bold` | `14px` | `ACTION REQUIRED`, `SEALED & READY`, Qty `1x` |

---

## 5. UI Betterment & Operational Guidelines for Claude

1. **Strict Typecheck Guarantee:**  
   Always run `npm run typecheck` (`tsc --noEmit`) before completing any task.
2. **Safe Area Inset Discipline:**  
   Always use `useSafeAreaInsets()` from `react-native-safe-area-context`. Add `paddingTop: insets.top + 8` on headers so Android status bar icons (clock, battery, camera hole) never overlap headers. Add `paddingBottom: insets.bottom + 8` to bottom tab bars and floating action buttons.
3. **No Overlapping Dev Overlays:**  
   Keep `LogBox.ignoreAllLogs(true)` in `App.tsx` to prevent warning banners from obscuring bottom navigation during daily store operations.
4. **Instant Visual State Feedback:**  
   Toggle switches (Open/Close shop, In-Stock/Out-of-Stock) must update optimistically so merchants see instant tactile feedback before the network API responds.
5. **High-Contrast Dark Mode Cards for Metrics:**  
   Keep the scale reading display and earnings summary on deep navy (`#0F172A`) backgrounds with bright green (`#34D399`) text to maintain readability under bright fluorescent mandi lights.

