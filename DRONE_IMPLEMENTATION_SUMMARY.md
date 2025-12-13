# Drone Implementation Summary

## What Was Added

### 1. Drone Operator Role (rate_9)
- **Location**: Crew Roles & Services section
- **Type**: Day-based role
- **Default Rates**:
  - Half-day: $800
  - Full-day: $1,500
- **Status**: Active by default
- **Customizable**: Yes, in Admin Setup Rates section

### 2. Drone Equipment (gear_7)
- **Location**: Gear/Equipment section
- **Investment Value**: $2,000
- **Status**: Included by default
- **Customizable**: Yes, in Admin Setup Gear section

### 3. Preset Integration
- **Commercial Preset**: Includes Drone Operator by default
- Other presets can be customized to include it

## How to Use

### For Crew-Based Drone Services (Contracting Out)
1. Go to "Roles & Services" section
2. Find "Drone Operator" card
3. Toggle it on
4. Set crew quantity, half days, and full days
5. Rate will be calculated based on your day type selection

### For In-House Drone Equipment
1. Go to "Gear & Equipment" section
2. Find "Drone" card (with video camera icon)
3. Toggle it on
4. Equipment amortization will be calculated automatically

### For Both (Full Drone Package)
- Enable both Drone Operator role AND Drone equipment
- This gives you crew cost + equipment amortization

## Admin Customization

### To Customize Drone Operator Rates
1. Go to Admin/Setup section
2. Find "Day Rates" tab
3. Locate "Drone Operator" (rate_9)
4. Adjust half-day and full-day rates as needed

### To Customize Drone Equipment Value
1. Go to Admin/Setup section
2. Find "Gear Costs" tab
3. Locate "Drone" (gear_7)
4. Adjust total investment value as needed

## Troubleshooting

### If Drone Operator doesn't appear in Roles & Services:
1. Go to Admin Setup → Day Rates
2. Find "Drone Operator" in the list
3. Make sure "Active" is checked
4. Save changes

### If Drone doesn't appear in Gear section:
1. Go to Admin Setup → Gear Costs
2. Find "Drone" in the list
3. Make sure "Include by Default" is checked
4. Save changes

## Technical Details

- **Drone Operator ID**: rate_9
- **Drone Equipment ID**: gear_7
- **Unit Type**: Day-based (for operator), Investment-based (for equipment)
- **Connects to**: Day type selection (half/full day pricing)
- **Included in**: Commercial preset template
