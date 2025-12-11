# Usage Rights & Talent Fees Implementation

## Overview
Added comprehensive support for usage rights/licensing fees and talent/actor fees to the videographer calculator, based on commercial production requirements.

## Features Added

### 1. Usage Rights & Licensing
- **Toggle**: Enable/disable usage rights fees
- **Duration Options**:
  - 6 Months
  - 1 Year (default)
  - 2 Years
  - Perpetual
  - Custom (with text input)
- **Cost Input**: Dollar amount for usage rights
- **Guidance**: Shows typical range (20-50% of production cost)

### 2. Talent Fees
- **Toggle**: Enable/disable talent fees
- **Primary Actors/Talent**:
  - Count input
  - Rate per primary actor (default: $500)
- **Extras/Background Talent**:
  - Count input
  - Rate per extra (default: $150)
- **Live Calculation**: Shows total talent fees in real-time

## Implementation Details

### Files Modified

#### 1. Calculator.jsx (`src/pages/Calculator.jsx`)
- Added form data fields:
  - `usage_rights_enabled`
  - `usage_rights_type`
  - `usage_rights_cost`
  - `usage_rights_duration`
  - `talent_fees_enabled`
  - `talent_primary_count`
  - `talent_primary_rate`
  - `talent_extra_count`
  - `talent_extra_rate`
- Added two new UI card sections after "Additional Costs"
- Both sections use collapsible design with checkbox toggles

#### 2. calculations.jsx (`src/components/calculator/calculations.jsx`)
- Added usage rights cost calculation
- Added talent fees calculation (primary + extras)
- Included both in subtotal calculation
- Updated return object to include:
  - `usageRightsCost`
  - `talentFees`
- Applied to both standard and single-price modes

#### 3. ExportService.jsx (`src/components/services/ExportService.jsx`)
- Updated text export to show usage rights and talent fees
- Updated HTML export "Additional Details" section
- Updated totals breakdown in HTML export
- Shows usage duration in parentheses

## Usage Example

Based on the whiskey commercial example:
1. Enable "Usage Rights Fee"
2. Select "1 Year" duration
3. Enter usage rights cost (e.g., $5,000)
4. Enable "Talent Fees"
5. Enter 2 primary actors at $500 each
6. Enter 5 extras at $150 each
7. Total talent: $1,750
8. These amounts are added to the subtotal before tax

## Calculation Flow

```
Labor + Overhead + Profit
+ Gear (amortized)
+ Travel
+ Rentals
+ Usage Rights
+ Talent Fees
= Subtotal
+ Rush Fee (if applicable)
- Discounts (if applicable)
= Subtotal 2
+ Tax
= Total
```

## Notes for Commercial Projects

### Usage Rights Typical Pricing
- **6 months**: 15-25% of production cost
- **1 year**: 20-40% of production cost
- **2 years**: 35-60% of production cost
- **Perpetual**: 50-100%+ of production cost

### Talent Fees Considerations
- Primary actors: $500-$2,000+ per day
- Extras: $150-$300 per day
- Union rates may apply (SAG-AFTRA)
- Usage rights for talent are separate from production usage rights
- Consider buyouts vs. residuals for extended campaigns

## Future Enhancements
- Preset usage rights packages
- Talent usage rights calculator (separate from production rights)
- Integration with talent agencies/databases
- Extension negotiation tracking
- Voiceover talent category
