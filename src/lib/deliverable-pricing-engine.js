/**
 * DELIVERABLE-BASED PRICING ENGINE
 * Implements the 4-layer model: Category → Deliverables → Execution Scope → Modifiers
 * Court-defensible, deterministic pricing algorithm
 */

/**
 * Compute effective production days based on deliverable policies
 */
function computeEffectiveProductionDays(selections, catalog) {
  // If production days are not included (post-only mode), skip all production day logic
  if (selections.includeProductionDays === false) {
    return 0;
  }
  
  let effectiveProductionDays = selections.productionDays || 0;
  
  // Check for locked production days from deliverables
  selections.deliverables.forEach(deliverable => {
    const delivDef = catalog.deliverables.find(d => d.id === deliverable.deliverableId);
    if (!delivDef) return;
    
    if (delivDef.productionDayPolicy?.mode === "locked") {
      const lockedDays = delivDef.productionDayPolicy.productionDaysLocked * deliverable.quantity;
      effectiveProductionDays = Math.max(effectiveProductionDays, lockedDays);
    }
  });
  
  // Enforce minimum from deliverable constraints (only when production is included)
  const maxMinDays = Math.max(
    0,
    ...selections.deliverables.map(d => {
      const delivDef = catalog.deliverables.find(def => def.id === d.deliverableId);
      return delivDef?.constraints?.minProductionDays || 0;
    })
  );
  
  if (effectiveProductionDays < maxMinDays) {
    throw new Error(`Minimum production days required: ${maxMinDays}`);
  }
  
  return effectiveProductionDays;
}

/**
 * Build line items array
 */
function buildLineItems(selections, catalog, effectiveProductionDays) {
  const lineItems = [];
  const scope = catalog.executionScopes.find(s => s.id === selections.executionScopeId);
  const category = catalog.productionCategories.find(c => c.id === selections.productionCategoryId);

  const pushSection = (label) => {
    lineItems.push({
      id: `section_${label.toLowerCase().replace(/\s+/g, '_')}`,
      kind: "section",
      label,
      quantity: 0,
      unit: "",
      unitPrice: 0,
      amount: 0,
      eligibleForMultiplier: false,
      isSection: true
    });
  };
  
  if (!scope) {
    throw new Error('Invalid execution scope selected');
  }
  
  // Use category-specific base day rate, or fall back to global default
  const baseDayRate = selections.customBaseDayRate ?? category?.baseDayRate ?? catalog.rules.baseDayRate;
  
  // 1. Production
  if (effectiveProductionDays > 0 || scope?.perDayAdd > 0) {
    pushSection("Production");
  }

  // 1. Production Days
  if (effectiveProductionDays > 0) {
    lineItems.push({
      id: "production_days",
      kind: "production_day",
      label: "Production Day Services",
      quantity: effectiveProductionDays,
      unit: "day",
      unitPrice: baseDayRate,
      amount: effectiveProductionDays * baseDayRate,
      eligibleForMultiplier: true
    });
  }
  
  // 2. Execution Scope (REQUIRED, always visible if not capture_only)
  // Use custom scope rate if provided, otherwise use catalog default
  const scopeRate = selections.customScopeRates?.[scope.id] ?? scope.perDayAdd;
  if (scopeRate > 0 && effectiveProductionDays > 0) {
    lineItems.push({
      id: "execution_scope",
      kind: "execution_scope",
      label: scope.labelInvoice,
      quantity: effectiveProductionDays,
      unit: "day",
      unitPrice: scopeRate,
      amount: effectiveProductionDays * scopeRate,
      eligibleForMultiplier: true
    });
  }
  
  // 3. Deliverables
  if ((selections.deliverables || []).length > 0) {
    pushSection("Deliverables");
  }

  selections.deliverables.forEach((deliverable, index) => {
    const delivDef = catalog.deliverables.find(d => d.id === deliverable.deliverableId);
    if (!delivDef) return;
    
    // Constraint validation
    if (delivDef.constraints?.requiresPost && !selections.postRequested) {
      throw new Error(`Deliverable '${delivDef.labelEstimate}' requires post-production.`);
    }
    
    if (delivDef.constraints?.minExecutionScope) {
      const requiredScopeIndex = catalog.executionScopes.findIndex(
        s => s.id === delivDef.constraints.minExecutionScope
      );
      const currentScopeIndex = catalog.executionScopes.findIndex(
        s => s.id === selections.executionScopeId
      );
      
      if (currentScopeIndex < requiredScopeIndex) {
        throw new Error(
          `Deliverable '${delivDef.labelEstimate}' requires minimum execution scope: ${delivDef.constraints.minExecutionScope}`
        );
      }
    }
    
    const unitPrice = deliverable.customRate ?? deliverable.overrides?.unitPrice ?? delivDef.unitPrice;
    
    lineItems.push({
      id: `deliverable_${deliverable.deliverableId}_${index}`,
      kind: "deliverable",
      label: delivDef.labelInvoice,
      quantity: deliverable.quantity,
      unit: delivDef.unit,
      unitPrice: unitPrice,
      amount: deliverable.quantity * unitPrice,
      eligibleForMultiplier: false
    });
  });
  
  // 4. Post Minimums (only if postRequested == true AND production days are included)
  // In post-only mode, the deliverable price already includes editing - no separate post minimum
  const isPostOnlyMode = selections.includeProductionDays === false || selections.workType === 'post_only';
  
  if (selections.postRequested && !isPostOnlyMode) {
    pushSection("Post-Production");

    let postMinimumTotal = 0;
    selections.deliverables.forEach((deliverable) => {
      const delivDef = catalog.deliverables.find(d => d.id === deliverable.deliverableId);
      if (!delivDef) return;

      let postMin = Math.max(
        delivDef.postMinimum || 0,
        catalog.rules.minimumPostPerDeliverable || 0
      );

      if (deliverable.overrides?.postMinimum !== undefined) {
        postMin = deliverable.overrides.postMinimum;
      }

      postMinimumTotal += (deliverable.quantity * postMin);
    });

    if (postMinimumTotal > 0) {
      lineItems.push({
        id: "post_minimum_total",
        kind: "post_minimum",
        label: "Post-Production Services (Minimum)",
        quantity: 1,
        unit: "service",
        unitPrice: postMinimumTotal,
        amount: postMinimumTotal,
        eligibleForMultiplier: false
      });
    }
  }
  
  // 5. Add-ons / Modifiers
  if ((selections.modifiers || []).length > 0) {
    pushSection("Add-ons");
  }

  // 5. Fixed Modifiers
  (selections.modifiers || []).forEach((modifier, index) => {
    const modDef = catalog.modifiers.find(m => m.id === modifier.modifierId);
    if (!modDef) return;
    
    // Visibility check
    if (modDef.visibility === "admin" && selections.context?.mode !== "admin") {
      return;
    }
    
    // Post-required check
    if (modDef.requiresPostRequested && !selections.postRequested) {
      throw new Error(`Modifier '${modDef.labelEstimate}' requires post-production to be enabled.`);
    }
    
    if (modDef.pricing.type === "fixed") {
      lineItems.push({
        id: `modifier_${modifier.modifierId}_${index}`,
        kind: "modifier_fixed",
        label: modDef.labelInvoice,
        quantity: modifier.quantity || 1,
        unit: modDef.pricing.unit || "service",
        unitPrice: modDef.pricing.value,
        amount: (modifier.quantity || 1) * modDef.pricing.value,
        eligibleForMultiplier: modDef.eligibleForMultiplier || false
      });
    }
  });
  
  return lineItems;
}

/**
 * Apply minimum project engagement (visible line item)
 * Only applies when production days are included
 */
function applyMinimumEngagement(lineItems, catalog, hasProductionDays = true) {
  const subtotalBeforeFloor = lineItems.reduce((sum, item) => sum + item.amount, 0);
  const minimumProjectSubtotal = catalog.rules.minimumProjectSubtotal || 0;
  let priceFloorAdded = 0;
  
  // Only apply minimum if production days are included
  if (hasProductionDays && subtotalBeforeFloor < minimumProjectSubtotal) {
    priceFloorAdded = minimumProjectSubtotal - subtotalBeforeFloor;
    
    lineItems.push({
      id: "price_floor",
      kind: "price_floor",
      label: catalog.rules.minimumEngagement?.labelInvoice || "Minimum Project Engagement (Price Floor)",
      quantity: 1,
      unit: "service",
      unitPrice: priceFloorAdded,
      amount: priceFloorAdded,
      eligibleForMultiplier: false
    });
  }
  
  const subtotalAfterFloor = subtotalBeforeFloor + priceFloorAdded;
  
  return {
    subtotalBeforeFloor,
    priceFloorAdded,
    subtotalAfterFloor
  };
}

/**
 * Apply scoped multipliers (only to eligible line items)
 */
function applyScopedMultipliers(selections, catalog, lineItems) {
  let multiplier = 1.0;
  const appliedToLineItemIds = [];
  
  // Find multiplier modifiers
  (selections.modifiers || []).forEach(modifier => {
    const modDef = catalog.modifiers.find(m => m.id === modifier.modifierId);
    if (modDef && modDef.pricing.type === "multiplier") {
      multiplier *= modDef.pricing.value;
    }
  });
  
  // Apply multiplier only to eligible line items
  let multiplierAmount = 0;
  lineItems.forEach(lineItem => {
    if (lineItem.eligibleForMultiplier) {
      const adjustment = lineItem.amount * (multiplier - 1.0);
      multiplierAmount += adjustment;
      appliedToLineItemIds.push(lineItem.id);
    }
  });
  
  return {
    multiplier,
    appliedToLineItemIds,
    multiplierAmount
  };
}

/**
 * Generate warnings (soft mentorship)
 */
function generateWarnings(selections, catalog) {
  const warnings = [];
  const scope = catalog.executionScopes.find(s => s.id === selections.executionScopeId);
  
  // Warning: Capture Only with Script Development
  if (scope?.id === "capture_only") {
    const hasScriptDev = (selections.modifiers || []).some(
      m => m.modifierId === "script_development"
    );
    if (hasScriptDev) {
      warnings.push({
        code: "CAPTURE_ONLY_WITH_SCRIPT",
        severity: "warning",
        message: "Capture Only execution scope selected with Script Development. Consider upgrading to Directed Production."
      });
    }
  }
  
  // Warning: Live production without live modifier
  const productionCategory = catalog.productionCategories.find(
    c => c.id === selections.productionCategoryId
  );
  if (productionCategory?.id === "live_stream_broadcast") {
    const hasLiveModifier = (selections.modifiers || []).some(
      m => m.modifierId === "live_environment_no_retakes"
    );
    if (!hasLiveModifier) {
      warnings.push({
        code: "LIVE_WITHOUT_LIVE_MODIFIER",
        severity: "info",
        message: "Live event production without Live Environment modifier. Consider adding for accurate risk pricing."
      });
    }
  }
  
  return warnings;
}

/**
 * Build estimate summary (client-facing)
 */
function buildEstimateSummary(selections, catalog) {
  const productionCategory = catalog.productionCategories.find(
    c => c.id === selections.productionCategoryId
  );
  const scope = catalog.executionScopes.find(s => s.id === selections.executionScopeId);
  
  const deliverables = selections.deliverables.map(d => {
    const delivDef = catalog.deliverables.find(def => def.id === d.deliverableId);
    return {
      label: delivDef?.labelEstimate || "Unknown",
      quantity: d.quantity
    };
  });
  
  const modifiers = (selections.modifiers || []).map(m => {
    const modDef = catalog.modifiers.find(def => def.id === m.modifierId);
    return modDef?.labelEstimate || "Unknown";
  });
  
  return {
    productionCategoryLabel: productionCategory?.label || "Unknown",
    executionScopeLabel: scope?.labelEstimate || "Unknown",
    deliverables,
    modifiers
  };
}

/**
 * Main calculation engine
 * @param {Object} selections - User selections from the form
 * @param {Object} catalog - Catalog data (rules, categories, deliverables, scopes, modifiers)
 * @returns {Object} Computed quote with line items, pricing, warnings, validations
 */
export function calculateDeliverableQuote(selections, catalog) {
  try {
    // Validate inputs
    if (!selections || !catalog) {
      throw new Error('Invalid input: selections and catalog are required');
    }
    
    // Step 1: Compute effective production days
    const effectiveProductionDays = computeEffectiveProductionDays(selections, catalog);
    
    // Check if production days are included (for price floor logic)
    const hasProductionDays = selections.includeProductionDays !== false && effectiveProductionDays > 0;
    
    // Step 2: Build line items
    const lineItems = buildLineItems(selections, catalog, effectiveProductionDays);
    
    // Step 3: Apply minimum project engagement (only if production days included)
    const { subtotalBeforeFloor, priceFloorAdded, subtotalAfterFloor } = 
      applyMinimumEngagement(lineItems, catalog, hasProductionDays);
    
    // Step 4: Apply scoped multipliers
    const scopedMultiplier = applyScopedMultipliers(selections, catalog, lineItems);
    
    // Step 5: Calculate total
    const total = subtotalAfterFloor + scopedMultiplier.multiplierAmount;
    
    // Step 6: Generate warnings
    const warnings = generateWarnings(selections, catalog);
    
    // Step 7: Build estimate summary
    const estimateSummary = buildEstimateSummary(selections, catalog);
    
    return {
      computed: {
        estimateSummary,
        lineItems,
        pricing: {
          subtotalBeforeFloor: Math.round(subtotalBeforeFloor * 100) / 100,
          minimumProjectSubtotal: catalog.rules.minimumProjectSubtotal,
          priceFloorAdded: Math.round(priceFloorAdded * 100) / 100,
          subtotalAfterFloor: Math.round(subtotalAfterFloor * 100) / 100,
          scopedMultiplier: {
            multiplier: scopedMultiplier.multiplier,
            appliedToLineItemIds: scopedMultiplier.appliedToLineItemIds,
            multiplierAmount: Math.round(scopedMultiplier.multiplierAmount * 100) / 100
          },
          total: Math.round(total * 100) / 100
        },
        warnings,
        validations: []
      }
    };
  } catch (error) {
    return {
      computed: {
        estimateSummary: null,
        lineItems: [],
        pricing: {
          subtotalBeforeFloor: 0,
          minimumProjectSubtotal: 0,
          priceFloorAdded: 0,
          subtotalAfterFloor: 0,
          scopedMultiplier: {
            multiplier: 1.0,
            appliedToLineItemIds: [],
            multiplierAmount: 0
          },
          total: 0
        },
        warnings: [],
        validations: [{
          code: "CALCULATION_ERROR",
          severity: "error",
          message: error.message
        }]
      }
    };
  }
}
