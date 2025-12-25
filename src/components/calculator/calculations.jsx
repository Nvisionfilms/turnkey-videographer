// CALCULATION ENGINE
// Follows specification from CALCULATION RULES
// Pure function - no side effects

// Default hours (can be overridden by settings)
const DEFAULT_FULL_DAY_HOURS = 10;
const DEFAULT_HALF_DAY_HOURS = 6;

function round2(num) {
  return Math.round(num * 100) / 100;
}

/**
 * Calculates role cost based on unit type and day type
 */
function calculateRoleCost(role, rateRow, dayType, customHours, settings) {
  const qty = role.quantity || 0;
  const crewQty = role.crew_qty ?? qty;
  const baseFull = rateRow.full_day_rate || 0;
  const baseHalf = rateRow.half_day_rate || 0;
  const overtimeMultiplier = settings?.overtime_multiplier || 1.5;
  
  // Use customizable hours from settings, fallback to defaults
  const FULL_DAY_HOURS = settings?.full_day_hours || DEFAULT_FULL_DAY_HOURS;

  let cost = 0;

  switch (rateRow.unit_type) {
    case "day":
      {
        const halfDays = role.half_days;
        const fullDays = role.full_days;

        // If per-role day split exists, it overrides global dayType for day-based rates.
        if (typeof halfDays === "number" || typeof fullDays === "number") {
          const hd = Number(halfDays || 0);
          const fd = Number(fullDays || 0);
          cost = crewQty * ((hd * baseHalf) + (fd * baseFull));
          break;
        }

        // Backward-compatible behavior
        if (dayType === "half") {
          cost = crewQty * baseHalf;
        } else if (dayType === "full") {
          cost = crewQty * baseFull;
        } else if (dayType === "custom") {
          const hours = customHours || FULL_DAY_HOURS;
          const prorataHours = Math.min(hours, FULL_DAY_HOURS);
          const prorata = (prorataHours / FULL_DAY_HOURS) * (baseFull * crewQty);
          
          const overtimeHours = Math.max(0, hours - FULL_DAY_HOURS);
          const overtime = overtimeHours > 0 
            ? (baseFull / FULL_DAY_HOURS) * overtimeHours * overtimeMultiplier * crewQty
            : 0;
          
          cost = prorata + overtime;
        }
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
      
      // Multiply by number of deliverables if specified
      const deliverableCount = role.deliverable_count || 1;
      cost = blocks * chosenRate * deliverableCount;
      break;

    case "per_deliverable":
      // Flat rate per deliverable, regardless of video length
      const numDeliverables = role.deliverable_count || 1;
      let deliverableRate;
      if (dayType === "half" && baseHalf > 0) {
        deliverableRate = baseHalf;
      } else if (dayType === "full" && baseFull > 0) {
        deliverableRate = baseFull;
      } else {
        deliverableRate = Math.max(baseHalf, baseFull);
      }
      cost = numDeliverables * deliverableRate;
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
 * Calculate gear amortization cost
 */
function calculateGearCost(formData, gearCosts, settings) {
  const FULL_DAY_HOURS = settings?.full_day_hours || DEFAULT_FULL_DAY_HOURS;
  const HALF_DAY_HOURS = settings?.half_day_hours || DEFAULT_HALF_DAY_HOURS;
  
  let gearAmortized = 0;
  if (formData.gear_enabled && Array.isArray(formData.selected_gear_items) && formData.selected_gear_items.length > 0) {
    const totalInvestment = gearCosts
      .filter(g => formData.selected_gear_items.includes(g.id))
      .reduce((sum, g) => sum + (g.total_investment || 0), 0);

    const amortizationDays = settings?.gear_amortization_days || 180;
    
    // Determine hours based on day type
    const dayType = formData.day_type || "full";
    let hours;
    if (dayType === "half") {
      hours = HALF_DAY_HOURS;
    } else if (dayType === "custom") {
      hours = formData.custom_hours || FULL_DAY_HOURS;
    } else {
      hours = FULL_DAY_HOURS;
    }
    
    gearAmortized = (totalInvestment / amortizationDays) * (hours / FULL_DAY_HOURS);
  }
  return round2(gearAmortized);
}

/**
 * Calculate travel cost
 */
function calculateTravelCost(formData, settings) {
  const travelMiles = formData.travel_miles || 0;
  const mileageRate = settings?.mileage_rate || 0.67;
  return round2(travelMiles * mileageRate);
}

/**
 * Main calculation engine
 */
export function calculateQuote(formData, dayRates, gearCosts, settings, deliverableEstimate = null) {
  if (!Array.isArray(dayRates) || !Array.isArray(gearCosts) || !settings) {
    console.error('Invalid input data for calculateQuote');
    return null;
  }

  // Use customizable hours from settings
  const FULL_DAY_HOURS = settings?.full_day_hours || DEFAULT_FULL_DAY_HOURS;
  const HALF_DAY_HOURS = settings?.half_day_hours || DEFAULT_HALF_DAY_HOURS;

  const dayType = formData.day_type || "full";
  
  // Determine actual hours based on day type
  let hours;
  if (dayType === "half") {
    hours = HALF_DAY_HOURS;
  } else if (dayType === "custom") {
    hours = formData.custom_hours || FULL_DAY_HOURS;
  } else {
    hours = FULL_DAY_HOURS;
  }
  const customHours = hours;
  const experienceLevel = formData.experience_level || "Standard";
  // Use custom_multiplier if available, otherwise fall back to preset from experience_levels
  const experienceMultiplier = formData.custom_multiplier || settings?.experience_levels?.[experienceLevel] || 1.0;
  const industryIndex = settings?.industry_index || 1.0;
  const regionMultiplier = settings?.region_multiplier || 1.0;

  // === SINGLE FIXED PRICE MODE ===
  if (formData.single_price_enabled && formData.single_price > 0) {
    const basePrice = formData.single_price || 0;
    
    // Add overhead and profit to base price
    const overheadPercent = settings?.overhead_percent || 0;
    const profitMarginPercent = settings?.profit_margin_percent || 0;
    const overhead = round2(basePrice * (overheadPercent / 100));
    const profitMargin = round2(basePrice * (profitMarginPercent / 100));
    const laborWithOverheadProfit = round2(basePrice + overhead + profitMargin);
    
    // Calculate gear, travel, rentals, usage rights, talent
    const gearAmortized = calculateGearCost(formData, gearCosts, settings);
    const travelCost = calculateTravelCost(formData, settings);
    const rentalCosts = formData.rental_costs || 0;
    const usageRightsCost = formData.usage_rights_enabled ? (formData.usage_rights_cost || 0) : 0;
    let talentFees = 0;
    if (formData.talent_fees_enabled) {
      const primaryTalent = (formData.talent_primary_count || 0) * (formData.talent_primary_rate || 0);
      const extraTalent = (formData.talent_extra_count || 0) * (formData.talent_extra_rate || 0);
      talentFees = primaryTalent + extraTalent;
    }
    
    const subtotal = round2(laborWithOverheadProfit + gearAmortized + travelCost + rentalCosts + usageRightsCost + talentFees);
    
    // Apply rush fee and discount
    const rushFeePercent = settings?.rush_fee_percent || 0;
    const rushFee = formData.apply_rush_fee ? round2(subtotal * (rushFeePercent / 100)) : 0;
    
    const nonprofitDiscountPercent = settings?.nonprofit_discount_percent || 0;
    const nonprofitDiscount = formData.apply_nonprofit_discount ? round2(subtotal * (nonprofitDiscountPercent / 100)) : 0;
    
    const subtotal2 = round2(subtotal + rushFee - nonprofitDiscount);
    
    // Calculate tax
    const taxRatePercent = settings?.tax_rate_percent || 0;
    const taxTravel = settings?.tax_travel || false;
    const taxableAmount = taxTravel ? subtotal2 : (subtotal2 - travelCost);
    const tax = round2(taxableAmount * (taxRatePercent / 100));
    
    const total = round2(subtotal2 + tax);
    const depositPercent = settings?.deposit_percent || 50;
    const depositDue = round2(total * (depositPercent / 100));
    const balanceDue = round2(total - depositDue);
    
    return {
      lineItems: [{ description: "Fixed Price Quote", amount: basePrice }],
      laborSubtotal: basePrice,
      overhead,
      profitMargin,
      laborWithOverheadProfit,
      gearAmortized,
      travelCost,
      rentalCosts,
      usageRightsCost: round2(usageRightsCost),
      talentFees: round2(talentFees),
      subtotal,
      rushFee,
      nonprofitDiscount,
      taxableAmount,
      tax,
      total,
      depositDue,
      balanceDue,
      dayType: "single_price",
      hours: 0,
      experienceMultiplier: 1.0,
      appliedMultipliers: {
        experience: 1.0,
        industry: 1.0,
        region: 1.0
      }
    };
  }

  // === LABOR COSTS ===
  const lineItems = [];
  let laborRaw = 0;
  let laborBase = 0; // Base cost before experience/region multipliers (actual cost you pay)

  // Separate production crew from post-production
  const productionCrewItems = [];
  const postProductionItems = [];

  if (Array.isArray(formData.selected_roles) && formData.selected_roles.length > 0) {
    formData.selected_roles.forEach(selectedRole => {
      const rate = dayRates.find(r => r.id === selectedRole.role_id);
      if (!rate) return;

      // Use the deliverable_count from the role itself (manually entered or preset from deliverable calculator)
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
        laborBase += roleCost; // Track base cost (before multipliers)

        let desc = rate.role;
        if (rate.unit_type === "day") {
          const actualDays = selectedRole.full_days || (dayType === "full" ? 1 : 0);
          const actualHalfDays = selectedRole.half_days || (dayType === "half" ? 1 : 0);
          const totalDays = actualDays + actualHalfDays;
          desc += ` (${selectedRole.quantity || 0} crew × ${totalDays} ${totalDays === 1 ? "day" : "days"}`;
          if (dayType === "custom") {
            desc += ` × ${customHours}h`;
          }
          desc += ")";
        } else if (rate.unit_type === "per_5_min") {
          const delivCount = selectedRole.deliverable_count || 1;
          desc += ` (${selectedRole.minutes_output || 0} min`;
          if (delivCount > 1) {
            desc += ` × ${delivCount} deliverables`;
          }
          desc += ")";
        } else if (rate.unit_type === "per_request") {
          desc += ` (${selectedRole.requests || 0} request(s))`;
        }

        // Build line item with quantity and unit price for per_deliverable roles
        let lineItem;
        if (rate.unit_type === "per_deliverable") {
          const delivCount = selectedRole.deliverable_count || 1;
          const unitPrice = adjustedCost / delivCount;
          lineItem = { 
            description: desc, 
            amount: adjustedCost,
            quantity: delivCount,
            unitPrice: unitPrice
          };
        } else {
          lineItem = { description: desc, amount: adjustedCost };
        }
        
        // Add category info to line item
        lineItem.category = rate.category || 'btl';
        
        // Categorize: post-production vs production crew
        const isPostProduction = rate.unit_type === "per_5_min" || 
                                 rate.unit_type === "per_deliverable" ||
                                 rate.unit_type === "per_request" ||
                                 (rate.role || '').toLowerCase().includes('editor') ||
                                 (rate.role || '').toLowerCase().includes('revision');
        
        if (isPostProduction) {
          postProductionItems.push(lineItem);
        } else {
          productionCrewItems.push(lineItem);
        }
      }
    });
  }

  // Audio Pre & Post (flat rate)
  if (formData.include_audio_pre_post) {
    const audioRate = dayRates.find(r => r.role === "Audio Pre & Post");
    if (audioRate) {
      // Use appropriate rate based on day type
      const baseRate = dayType === 'half' ? audioRate.half_day_rate : audioRate.full_day_rate;
      const audioCost = baseRate * experienceMultiplier * industryIndex * regionMultiplier;
      laborRaw += audioCost;
      postProductionItems.push({ description: "Audio Pre & Post Production", amount: audioCost });
    }
  }

  // === OVERHEAD & PROFIT (shown as separate line item) ===
  // Base rates are your COST, service fee is your MARKUP for management/coordination
  const overheadPercent = settings?.overhead_percent || 0;
  const profitMarginPercent = settings?.profit_margin_percent || 0;
  const totalOperationsFeePercent = overheadPercent + profitMarginPercent;

  // Build final line items with sections (base rates shown)
  if (productionCrewItems.length > 0) {
    lineItems.push({ description: "Production & Crew", amount: 0, isSection: true });
    lineItems.push(...productionCrewItems);
  }
  
  if (postProductionItems.length > 0) {
    lineItems.push({ description: "Post-Production", amount: 0, isSection: true });
    lineItems.push(...postProductionItems);
  }
  
  // Add overhead + margin as separate line item (your markup for scouting, hiring, coordination, profit)
  // Only show as separate line if show_service_fee_on_invoice is true
  const operationsFee = totalOperationsFeePercent > 0 ? round2(laborRaw * (totalOperationsFeePercent / 100)) : 0;
  const showServiceFeeOnInvoice = settings?.show_service_fee_on_invoice !== false;
  if (operationsFee > 0 && showServiceFeeOnInvoice) {
    lineItems.push({ 
      description: `Overhead + Margin (${totalOperationsFeePercent}%)`, 
      amount: operationsFee,
      category: 'OVERHEAD_MARGIN',
      type: 'DECISION'
    });
  }

  // === CALCULATE GEAR AMORTIZATION ===
  let gearAmortized = 0;
  if (formData.gear_enabled && Array.isArray(formData.selected_gear_items) && formData.selected_gear_items.length > 0) {
    const totalInvestment = gearCosts
      .filter(g => formData.selected_gear_items.includes(g.id))
      .reduce((sum, g) => sum + (g.total_investment || 0), 0);

    const amortizationDays = settings?.gear_amortization_days || 180;
    gearAmortized = (totalInvestment / amortizationDays) * (customHours / FULL_DAY_HOURS);
  }

  // === TRAVEL COSTS ===
  const travelMiles = formData.travel_miles || 0;
  const mileageRate = settings?.mileage_rate || 0.67;
  const travelCost = travelMiles * mileageRate;

  // === RENTAL COSTS ===
  const rentalCosts = formData.rental_costs || 0;

  // === USAGE RIGHTS ===
  const usageRightsCost = formData.usage_rights_enabled ? (formData.usage_rights_cost || 0) : 0;

  // === TALENT FEES ===
  let talentFees = 0;
  if (formData.talent_fees_enabled) {
    const primaryTalent = (formData.talent_primary_count || 0) * (formData.talent_primary_rate || 0);
    const extraTalent = (formData.talent_extra_count || 0) * (formData.talent_extra_rate || 0);
    talentFees = primaryTalent + extraTalent;
  }

  // Calculate overhead and profit from labor (for internal tracking)
  const overhead = laborRaw * (overheadPercent / 100);
  const profitMargin = laborRaw * (profitMarginPercent / 100);
  
  // Labor with overhead/profit = base labor + service fee
  const laborWithOverheadProfit = laborRaw + overhead + profitMargin;

  // === SUBTOTAL ===
  const subtotal = laborWithOverheadProfit + gearAmortized + travelCost + rentalCosts + usageRightsCost + talentFees;

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

  // === ADD OTHER COSTS AS LINE ITEMS ===
  // Add gear amortization
  if (gearAmortized > 0) {
    lineItems.push({ description: "Equipment & Gear", amount: round2(gearAmortized) });
  }
  
  // Add travel costs
  if (travelCost > 0) {
    lineItems.push({ description: `Travel (${travelMiles} miles @ $${mileageRate}/mi)`, amount: round2(travelCost) });
  }
  
  // Add rental costs
  if (rentalCosts > 0) {
    lineItems.push({ description: "Rental Costs", amount: round2(rentalCosts) });
  }
  
  // Add usage rights
  if (usageRightsCost > 0) {
    lineItems.push({ description: "Usage Rights & Licensing", amount: round2(usageRightsCost) });
  }
  
  // Add talent fees
  if (talentFees > 0) {
    lineItems.push({ description: "Talent Fees", amount: round2(talentFees) });
  }
  
  // Overhead and profit margin are calculated and included in pricing
  // but not shown as separate line items in client-facing quotes
  
  // Add rush fee
  if (rushFee > 0) {
    lineItems.push({ description: `Rush Fee (${rushFeePercent}%)`, amount: round2(rushFee) });
  }
  
  // Add nonprofit discount
  if (nonprofitDiscount > 0) {
    lineItems.push({ description: `Nonprofit Discount (${nonprofitDiscountPercent}%)`, amount: -round2(nonprofitDiscount) });
  }
  
  // Add tax
  if (tax > 0) {
    lineItems.push({ description: `Tax (${taxRatePercent}%)`, amount: round2(tax) });
  }

  // === FINAL TOTALS ===
  const total = round2(subtotal2 + tax);
  
  const depositPercent = settings?.deposit_percent || 50;
  const depositDue = round2(total * (depositPercent / 100));
  const balanceDue = round2(total - depositDue);

  // === NEGOTIATION RANGE ===
  // Floor = Max of (base costs) or (scaled floor based on experience)
  // This ensures floor never goes below actual costs, but scales up with premium rates
  // High = Desired profit margin applied to total
  const juniorOpsMultiplier = settings?.experience_levels?.Junior || 0.65;
  const desiredProfitPercent = settings?.desired_profit_margin_percent || 60;
  
  // Calculate ABSOLUTE MINIMUM floor (base costs + minimal markup)
  // This is the break-even point - can never go below this
  const minimalOpsFeeBase = round2(laborBase * (totalOperationsFeePercent / 100) * juniorOpsMultiplier);
  const absoluteFloorSubtotal = laborBase + gearAmortized + minimalOpsFeeBase + travelCost + rentalCosts + usageRightsCost + talentFees;
  const absoluteFloorWithFees = absoluteFloorSubtotal + (formData.apply_rush_fee ? absoluteFloorSubtotal * (rushFeePercent / 100) : 0) 
                                - (formData.apply_nonprofit_discount ? absoluteFloorSubtotal * (nonprofitDiscountPercent / 100) : 0);
  const absoluteFloorTax = taxRatePercent > 0 ? round2(absoluteFloorWithFees * (taxRatePercent / 100)) : 0;
  const absoluteFloor = round2(absoluteFloorWithFees + absoluteFloorTax);
  
  // Calculate SCALED floor (proportional to current experience level)
  // When charging premium rates, floor should also be higher
  // Scaled floor = current total * (1 - discount%) where discount is ~10% below current
  const floorDiscountPercent = 10; // Floor is 10% below current quote
  const scaledFloor = round2(total * (1 - floorDiscountPercent / 100));
  
  // Final floor = whichever is higher (never below absolute minimum)
  const negotiationLow = Math.max(absoluteFloor, scaledFloor);
  
  // Calculate negotiation high (desired profit margin on top of current total)
  const negotiationHigh = round2(total * (1 + desiredProfitPercent / 100));

  // === PRODUCTION COST SUMMARY (for simplified invoices) ===
  // Group all labor into single "Production Cost" line
  const productionCost = round2(laborWithOverheadProfit);
  
  // Separate ATL and BTL totals
  const atlItems = lineItems.filter(li => li.category === 'atl' && !li.isSection);
  const btlItems = lineItems.filter(li => li.category === 'btl' && !li.isSection);
  const atlTotal = round2(atlItems.reduce((sum, li) => sum + (li.amount || 0), 0));
  const btlTotal = round2(btlItems.reduce((sum, li) => sum + (li.amount || 0), 0));

  return {
    lineItems,
    laborSubtotal: round2(laborRaw),
    laborBase: round2(laborBase), // Base cost before experience multiplier
    operationsFee: round2(operationsFee), // Operations fee (overhead + profit margin)
    overhead: round2(overhead),
    profitMargin: round2(profitMargin),
    laborWithOverheadProfit: round2(laborWithOverheadProfit),
    gearAmortized: round2(gearAmortized),
    travelCost: round2(travelCost),
    rentalCosts: round2(rentalCosts),
    usageRightsCost: round2(usageRightsCost),
    talentFees: round2(talentFees),
    subtotal: round2(subtotal),
    rushFee: round2(rushFee),
    nonprofitDiscount: round2(nonprofitDiscount),
    taxableAmount: round2(taxableAmount),
    tax: round2(tax),
    total,
    depositDue,
    balanceDue,
    dayType,
    hours: customHours,
    experienceMultiplier,
    appliedMultipliers: {
      experience: experienceMultiplier,
      industry: industryIndex,
      region: regionMultiplier
    },
    // Negotiation range
    negotiationLow,
    negotiationHigh,
    // Production summary for simplified invoices
    productionCost,
    atlTotal,
    btlTotal
  };
}