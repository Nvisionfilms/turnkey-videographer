// VALIDATION UTILITIES
// Pure functions for form validation

export const validateQuote = (formData) => {
  const errors = [];
  
  // Validate pricing model selection
  if (!formData.day_type || formData.day_type === "") {
    errors.push({
      field: "day_type",
      message: "Please select a pricing model (Half Day, Full Day, or Custom)"
    });
  }
  
  // Validate custom hours if custom pricing is selected
  if (formData.day_type === "custom") {
    if (!formData.custom_hours || formData.custom_hours <= 0) {
      errors.push({
        field: "custom_hours",
        message: "Custom hours must be greater than 0"
      });
    }
    if (formData.custom_hours > 14) {
      errors.push({
        field: "custom_hours",
        message: "Hours exceed 14. Consider breaking into multiple days.",
        severity: "warning"
      });
    }
    if (!formData.custom_hourly_rate || formData.custom_hourly_rate <= 0) {
      errors.push({
        field: "custom_hourly_rate",
        message: "Custom hourly rate must be greater than 0"
      });
    }
  }
  
  // Validate unique roles
  if (formData.selected_roles && formData.selected_roles.length > 0) {
    const roleIds = formData.selected_roles.map(r => r.role_id);
    const uniqueRoleIds = new Set(roleIds);
    if (roleIds.length !== uniqueRoleIds.size) {
      errors.push({
        field: "selected_roles",
        message: "Each role can only be selected once. Remove duplicates.",
        severity: "error"
      });
    }
  }
  
  // Validate at least one service selected
  if (!formData.selected_roles || formData.selected_roles.length === 0) {
    if (!formData.include_audio_pre_post) {
      errors.push({
        field: "selected_roles",
        message: "Please select at least one role or service",
        severity: "warning"
      });
    }
  }
  
  // Validate client info for export
  if (!formData.client_name || formData.client_name.trim() === "") {
    errors.push({
      field: "client_name",
      message: "Client name is recommended for professional quotes",
      severity: "warning"
    });
  }
  
  if (!formData.project_title || formData.project_title.trim() === "") {
    errors.push({
      field: "project_title",
      message: "Project title is recommended for professional quotes",
      severity: "warning"
    });
  }
  
  return {
    isValid: errors.filter(e => e.severity !== "warning").length === 0,
    errors,
    warnings: errors.filter(e => e.severity === "warning")
  };
};

export const validateDayRate = (rate) => {
  const errors = [];
  
  if (!rate.role || rate.role.trim() === "") {
    errors.push({ field: "role", message: "Role name is required" });
  }
  
  if (!rate.unit_type) {
    errors.push({ field: "unit_type", message: "Unit type is required" });
  }
  
  const halfRate = rate.half_day_rate || 0;
  const fullRate = rate.full_day_rate || 0;
  
  if (halfRate + fullRate === 0) {
    errors.push({
      field: "rates",
      message: "At least one rate (half day or full day) must be greater than 0"
    });
  }
  
  if (halfRate < 0 || fullRate < 0) {
    errors.push({
      field: "rates",
      message: "Rates cannot be negative"
    });
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

export const validateGearCost = (gear) => {
  const errors = [];
  
  if (!gear.item || gear.item.trim() === "") {
    errors.push({ field: "item", message: "Gear item name is required" });
  }
  
  if (gear.total_investment === undefined || gear.total_investment === null) {
    errors.push({ field: "total_investment", message: "Total investment is required" });
  }
  
  if (gear.total_investment < 0) {
    errors.push({ field: "total_investment", message: "Total investment cannot be negative" });
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};