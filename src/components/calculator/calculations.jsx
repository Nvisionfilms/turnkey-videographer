// CALCULATION ENGINE
// Follows specification from CALCULATION RULES
// Pure function - no side effects

const FULL_DAY_HOURS = 10;
const HALF_DAY_HOURS = 6;

function round2(num) {
  return Math.round(num * 100) / 100;
}

/**
 * Calculates role cost based on unit type and day type
 */
function calculateRoleCost(role, rateRow, dayType, customHours, settings) {
  const qty = role.quantity || 0;
  const baseFull = rateRow.full_day_rate || 0;
  const baseHalf = rateRow.half_day_rate || 0;
  const overtimeMultiplier = settings?.overtime_multiplier || 1.5;

  let cost = 0;

  switch (rateRow.unit_type) {
    case "day":
      if (dayType === "half") {
        cost = qty * baseHalf;
      } else if (dayType === "full") {
        cost = qty * baseFull;
      } else if (dayType === "custom") {
        const hours = customHours || FULL_DAY_HOURS;
        const prorataHours = Math.min(hours, FULL_DAY_HOURS);
        const prorata = (prorataHours / FULL_DAY_HOURS) * (baseFull * qty);
        
        const overtimeHours = Math.max(0, hours - FULL_DAY_HOURS);
        const overtime = overtimeHours > 0 
          ? (baseFull / FULL_DAY_HOURS) * overtimeHours * overtimeMultiplier * qty
          : 0;
        
        cost = prorata + overtime;
      }
      break;

    case "per_5_min":
      const minutesOutput = role.minutes_output || 0;
      const blocks = Math.ceil(minutesOutput / 5);
      
      let chosenRate;
      if (dayType === "half" && baseHalf > 0) {
        chosenRate = baseHalf;
      } else if (dayType === "full" && baseFull > 0) {
        chosenRate = baseFull;
      } else {
        chosenRate = Math.max(baseHalf, baseFull);
      }
      
      cost = blocks * chosenRate;
      break;

    case "per_request":
      const requests = role.requests || 0;
      cost = requests * Math.max(baseHalf, baseFull);
      break;

    case "flat":
      cost = Math.max(baseHalf, baseFull);
      break;

    default:
      cost = 0;
  }

  return cost;
}

/**
 * Main calculation engine
 */
export function calculateQuote(formData, dayRates, gearCosts, settings) {
  if (!Array.isArray(dayRates) || !Array.isArray(gearCosts) || !settings) {
    console.error('Invalid input data for calculateQuote');
    return null;
  }

  const dayType = formData.day_type || "full";
  const customHours = formData.custom_hours || FULL_DAY_HOURS;

  const hours = dayType === "half" ? HALF_DAY_HOURS :
                dayType === "full" ? FULL_DAY_HOURS :
                customHours;

  const experienceMultiplier = formData.custom_multiplier || 1.0;
  const industryIndex = settings?.industry_index || 1.0;
  const regionMultiplier = settings?.region_multiplier || 1.0;

  // === CALCULATE LABOR COSTS ===
  let laborRaw = 0;
  const lineItems = [];

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

        let desc = rate.role;
        if (rate.unit_type === "day") {
          desc += ` (${selectedRole.quantity || 0} ${dayType === "half" ? "half day(s)" : dayType === "full" ? "full day(s)" : "day(s)"}`;
          if (dayType === "custom") {
            desc += ` × ${customHours}h`;
          }
          desc += ")";
        } else if (rate.unit_type === "per_5_min") {
          desc += ` (${selectedRole.minutes_output || 0} min)`;
        } else if (rate.unit_type === "per_request") {
          desc += ` (${selectedRole.requests || 0} request(s))`;
        }

        lineItems.push({ description: desc, amount: adjustedCost });
      }
    });
  }

  // Audio Pre & Post (flat rate)
  if (formData.include_audio_pre_post) {
    const audioRate = dayRates.find(r => r.role === "Audio Pre & Post");
    if (audioRate) {
      const audioCost = Math.max(audioRate.half_day_rate, audioRate.full_day_rate) * 
                        experienceMultiplier * industryIndex * regionMultiplier;
      laborRaw += audioCost;
      lineItems.push({ description: "Audio Pre & Post Production", amount: audioCost });
    }
  }

  // === CALCULATE GEAR AMORTIZATION ===
  let gearAmortized = 0;
  if (formData.gear_enabled && Array.isArray(formData.selected_gear_items) && formData.selected_gear_items.length > 0) {
    const totalInvestment = gearCosts
      .filter(g => formData.selected_gear_items.includes(g.id))
      .reduce((sum, g) => sum + (g.total_investment || 0), 0);

    const amortizationDays = settings?.gear_amortization_days || 180;
    gearAmortized = (totalInvestment / amortizationDays) * (hours / FULL_DAY_HOURS);
  }

  // === TRAVEL COSTS ===
  const travelMiles = formData.travel_miles || 0;
  const mileageRate = settings?.mileage_rate || 0.67;
  const travelCost = travelMiles * mileageRate;

  // === RENTAL COSTS ===
  const rentalCosts = formData.rental_costs || 0;

  // === SUBTOTAL ===
  const subtotal = laborRaw + gearAmortized + travelCost + rentalCosts;

  // === RUSH FEE ===
  const rushFeePercent = settings?.rush_fee_percent || 0;
  const rushFee = formData.apply_rush_fee ? subtotal * (rushFeePercent / 100) : 0;

  // === NONPROFIT DISCOUNT ===
  const nonprofitDiscountPercent = settings?.nonprofit_discount_percent || 0;
  const nonprofitDiscount = formData.apply_nonprofit_discount ? subtotal * (nonprofitDiscountPercent / 100) : 0;

  // === SUBTOTAL AFTER FEES/DISCOUNTS ===
  const subtotal2 = subtotal + rushFee - nonprofitDiscount;

  // === TAX ===
  const taxRatePercent = settings?.tax_rate_percent || 0;
  const taxTravel = settings?.tax_travel || false;
  
  const taxableAmount = taxTravel ? subtotal2 : (subtotal2 - travelCost);
  const tax = taxableAmount * (taxRatePercent / 100);

  // === FINAL TOTALS ===
  const total = round2(subtotal2 + tax);
  
  const depositPercent = settings?.deposit_percent || 50;
  const depositDue = round2(total * (depositPercent / 100));
  const balanceDue = round2(total - depositDue);

  return {
    lineItems,
    laborSubtotal: round2(laborRaw),
    gearAmortized: round2(gearAmortized),
    travelCost: round2(travelCost),
    rentalCosts: round2(rentalCosts),
    subtotal: round2(subtotal),
    rushFee: round2(rushFee),
    nonprofitDiscount: round2(nonprofitDiscount),
    taxableAmount: round2(taxableAmount),
    tax: round2(tax),
    total,
    depositDue,
    balanceDue,
    dayType,
    hours,
    experienceMultiplier,
    appliedMultipliers: {
      experience: experienceMultiplier,
      industry: industryIndex,
      region: regionMultiplier
    }
  };
}