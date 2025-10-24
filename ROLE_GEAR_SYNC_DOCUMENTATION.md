# Role & Gear Synchronization Documentation

## Overview
This document explains how roles and gear added in the Setup (Admin) page automatically reflect in the Calculator page and are included in all calculation formulas.

## How It Works

### 1. Adding a Role in Setup Page

When you add a new role in the Admin page (`/src/pages/Admin.jsx`):

1. **User Action**: Click "Add New Rate" button
2. **Data Entry**: Fill in role name, unit type, half day rate, full day rate
3. **Save**: Click "Create" button
4. **Storage**: 
   - New role is added to `dayRates` state array with unique ID
   - Saved to `localStorage` under key `nvision_day_rates`
   - Storage event is dispatched to notify other components

```javascript
const createRate = (data) => {
  const newId = `rate_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  const newRateObj = { ...data, id: newId };
  const updated = [...dayRates, newRateObj];
  setDayRates(updated);
  saveDataToStorage(STORAGE_KEYS.DAY_RATES, updated);
  // Storage event is automatically dispatched in saveDataToStorage
};
```

### 2. Calculator Page Receives Update

The Calculator page (`/src/pages/Calculator.jsx`) listens for storage changes:

```javascript
useEffect(() => {
  const handleStorageChange = (e) => {
    if (e.key === STORAGE_KEYS.DAY_RATES && e.newValue) {
      const newRates = JSON.parse(e.newValue);
      setDayRates(newRates);
    }
  };
  window.addEventListener('storage', handleStorageChange);
  return () => window.removeEventListener('storage', handleStorageChange);
}, []);
```

### 3. Role Appears in RoleSelector

The `RoleSelector` component (`/src/components/calculator/RoleSelector.jsx`) automatically displays all active roles:

```javascript
{dayRates.filter(r => r.active && r.unit_type !== 'flat').map((rate) => {
  // Renders each role with checkbox and quantity inputs
})}
```

**Important**: Only roles with `active: true` and `unit_type !== 'flat'` appear in the selector. Flat rate roles (like "Audio Pre & Post") are handled separately.

### 4. Role Included in Calculations

When a role is selected, it's included in the calculation engine (`/src/components/calculator/calculations.jsx`):

```javascript
export function calculateQuote(formData, dayRates, gearCosts, settings) {
  // ... calculation logic
  
  if (Array.isArray(formData.selected_roles)) {
    formData.selected_roles.forEach(selectedRole => {
      const rate = dayRates.find(r => r.id === selectedRole.role_id);
      if (!rate) return;

      const roleCost = calculateRoleCost(
        selectedRole,
        rate,
        dayType,
        customHours,
        settings
      );

      const adjustedCost = roleCost * experienceMultiplier * industryIndex * regionMultiplier;
      
      if (adjustedCost > 0) {
        laborRaw += adjustedCost;
        lineItems.push({ description: desc, amount: adjustedCost });
      }
    });
  }
}
```

## Gear Synchronization

### 1. Adding Gear in Setup Page

Similar process for gear items:

1. **User Action**: Click "Add New Gear" button
2. **Data Entry**: Fill in item name, total investment, include by default checkbox
3. **Save**: Click "Create" button
4. **Storage**: 
   - New gear is added to `gearCosts` state array with unique ID
   - Saved to `localStorage` under key `nvision_gear_costs`
   - Storage event is dispatched

```javascript
const createGear = (data) => {
  const newId = `gear_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  const newGearObj = { ...data, id: newId };
  const updated = [...gearCosts, newGearObj];
  setGearCosts(updated);
  saveDataToStorage(STORAGE_KEYS.GEAR_COSTS, updated);
};
```

### 2. Gear Appears in GearSelector

The `GearSelector` component (`/src/components/calculator/GearSelector.jsx`) displays all gear items:

```javascript
{gearCosts.map((gear) => {
  const selected = isGearSelected(gear.id);
  return (
    <div key={gear.id}>
      <Checkbox
        checked={selected}
        onCheckedChange={(checked) => handleGearToggle(gear.id, checked)}
      />
      <Label>{gear.item}</Label>
      <p>Investment: ${gear.total_investment.toLocaleString()}</p>
    </div>
  );
})}
```

### 3. Gear Included in Calculations

Gear amortization is automatically calculated:

```javascript
let gearAmortized = 0;
if (formData.gear_enabled && Array.isArray(formData.selected_gear_items)) {
  const totalInvestment = gearCosts
    .filter(g => formData.selected_gear_items.includes(g.id))
    .reduce((sum, g) => sum + (g.total_investment || 0), 0);

  const amortizationDays = settings?.gear_amortization_days || 180;
  gearAmortized = (totalInvestment / amortizationDays) * (hours / FULL_DAY_HOURS);
}
```

## Calculation Formula Breakdown

### Labor Costs
For each selected role:
```
roleCost = baseRate × quantity × experienceMultiplier × industryIndex × regionMultiplier
```

Different unit types:
- **Day**: Uses half_day_rate or full_day_rate based on day_type
- **Per 5 min**: `Math.ceil(minutes_output / 5) × rate`
- **Per request**: `requests × rate`
- **Flat**: Uses the rate directly

### Gear Amortization
```
dailyGearCost = (totalInvestment / amortizationDays) × (hours / 10)
```

### Final Quote Calculation
```
subtotal = laborCosts + gearAmortized + travelCost + rentalCosts
subtotalWithFees = subtotal + rushFee - nonprofitDiscount
taxableAmount = taxTravel ? subtotalWithFees : (subtotalWithFees - travelCost)
tax = taxableAmount × (taxRatePercent / 100)
total = subtotalWithFees + tax
```

## Testing the Flow

### Test Case 1: Add New Role
1. Go to Setup page → Day Rates tab
2. Click "Add New Rate"
3. Enter:
   - Role: "Gaffer"
   - Unit Type: "Day"
   - Half Day Rate: 600
   - Full Day Rate: 1000
4. Click "Create"
5. Go to Calculator page
6. Verify "Gaffer" appears in Roles & Services section
7. Select it and enter quantity
8. Verify it appears in the quote calculation

### Test Case 2: Add New Gear
1. Go to Setup page → Gear Costs tab
2. Click "Add New Gear"
3. Enter:
   - Item Name: "Slider"
   - Total Investment: 800
   - Check "Include by default"
4. Click "Create"
5. Go to Calculator page
6. Verify "Slider" appears in Gear & Equipment section
7. Verify it's pre-selected (if "Include by default" was checked)
8. Verify gear amortization includes the new item

### Test Case 3: Edit Existing Items
1. Edit a role's rate in Setup page
2. Verify the new rate is immediately reflected in Calculator calculations
3. Edit gear investment amount
4. Verify gear amortization updates accordingly

## Important Notes

1. **Active Status**: Only roles with `active: true` appear in the Calculator's role selector
2. **Flat Rate Roles**: Roles with `unit_type: 'flat'` (like "Audio Pre & Post") are handled separately and don't appear in the main role selector
3. **Default Gear**: Gear items with `include_by_default: true` are automatically selected when gear is enabled
4. **Real-time Sync**: Changes in Setup page are immediately reflected in Calculator page through localStorage events
5. **Local Storage**: All data is stored locally in the browser - no server sync required

## Data Structure

### Role Object
```javascript
{
  id: "rate_1234567890_abc123",
  role: "Camera op (no camera)",
  unit_type: "day", // or "per_5_min", "per_request", "flat"
  half_day_rate: 1200,
  full_day_rate: 2000,
  active: true,
  notes: ""
}
```

### Gear Object
```javascript
{
  id: "gear_1234567890_abc123",
  item: "Camera Body",
  total_investment: 6000,
  include_by_default: true
}
```

### Selected Role in Calculator
```javascript
{
  role_id: "rate_1234567890_abc123",
  role_name: "Camera op (no camera)",
  unit_type: "day",
  quantity: 2,
  minutes_output: 0,
  requests: 0
}
```

## Troubleshooting

### Role doesn't appear in Calculator
- Check if `active` is set to `true` in Setup page
- Check if `unit_type` is not `'flat'` (flat rates are handled separately)
- Verify localStorage contains the updated data
- Try refreshing the Calculator page

### Gear doesn't appear in Calculator
- Verify gear was saved successfully in Setup page
- Check browser console for any errors
- Verify localStorage contains the updated gear data

### Calculations seem incorrect
- Verify all multipliers in Business Info settings
- Check experience level multiplier
- Verify gear amortization days setting
- Review the calculation breakdown in LiveTotalsPanel
