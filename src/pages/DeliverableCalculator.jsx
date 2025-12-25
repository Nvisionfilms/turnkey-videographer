import React, { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Video, 
  Package, 
  Settings, 
  AlertCircle, 
  CheckCircle2,
  Download,
  RotateCcw,
  Plus,
  Minus,
  ArrowRight
} from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { calculateDeliverableQuote } from "../lib/deliverable-pricing-engine";
import catalogData from "../../catalog-v1.2.json";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { useUnlockStatus } from "../components/hooks/useUnlockStatus";
import { EnhancedExportService } from "../components/services/EnhancedExportService";
import { STORAGE_KEYS, DEFAULT_SETTINGS } from "../components/data/defaults";

export default function DeliverableCalculator() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { isUnlocked, hasUsedFreeQuote, markFreeQuoteUsed } = useUnlockStatus();
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);

  const cardStyle = useMemo(() => ({
    background: 'var(--color-bg-secondary)',
    borderColor: 'var(--color-border)'
  }), []);
  
  // Form state matching the schema
  // Nothing is pre-activated - user must select a work type first
  const [selections, setSelections] = useState({
    workType: null, // null = nothing selected yet
    productionCategoryId: "content_creation",
    executionScopeId: "capture_only",
    productionDays: 0,
    includeProductionDays: false,
    postRequested: false,
    deliverables: [],
    modifiers: [],
    customBaseDayRate: null,
    customScopeRates: {},
    context: {
      mode: "public"
    }
  });
  
  const [clientMeta, setClientMeta] = useState({
    clientName: "",
    projectName: "",
    notes: ""
  });

  useEffect(() => {
    try {
      const settingsStr = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      if (settingsStr) {
        setSettings(JSON.parse(settingsStr));
      } else {
        setSettings(DEFAULT_SETTINGS);
      }
    } catch {
      setSettings(DEFAULT_SETTINGS);
    }
  }, []);
  
  // Calculate quote
  const quote = useMemo(() => {
    return calculateDeliverableQuote(selections, catalogData);
  }, [selections]);

  const hasCalculationError = useMemo(() => {
    return Boolean(
      (quote?.computed?.validations || []).some(v => v?.severity === 'error')
    );
  }, [quote]);

  const checkAccessAndProceed = (action) => {
    if (!isUnlocked) {
      toast({
        title: "Ledger access required",
        description: "This action records pricing decisions. Enable recording to continue.",
        variant: "destructive",
      });
      navigate(createPageUrl("Unlock"));
      return;
    }

    action();
  };

  const buildExportPayload = () => {
    const computed = quote?.computed;
    const pricing = computed?.pricing;

    const total = pricing?.total || 0;
    const originalTotal = pricing?.total || 0;
    const depositPercent = settings?.deposit_percent || 50;
    const depositDue = Math.round(total * (depositPercent / 100) * 100) / 100;
    const balanceDue = Math.round((total - depositDue) * 100) / 100;

    return {
      formData: {
        client_name: clientMeta.clientName,
        project_title: clientMeta.projectName,
        shoot_dates: [],
        notes_for_quote: clientMeta.notes,
      },
      calculations: {
        lineItems: (computed?.lineItems || []).map((li) => ({
          description: li.label,
          quantity: typeof li.quantity === 'number' ? li.quantity : 1,
          unitPrice: typeof li.unitPrice === 'number'
            ? li.unitPrice
            : (typeof li.amount === 'number' ? li.amount : 0),
          amount: li.amount,
        })),
        total,
        originalTotal,
        depositDue,
        balanceDue,
      },
    };
  };

  const persistEstimateAndGoToCrew = () => {
    const computed = quote?.computed;
    if (!computed) return;

    const payload = {
      version: "v1",
      createdAt: new Date().toISOString(),
      clientMeta,
      selections,
      computed
    };

    try {
      localStorage.setItem(STORAGE_KEYS.DELIVERABLE_ESTIMATE, JSON.stringify(payload));
    } catch {
      // Ignore storage errors
    }

    try {
      localStorage.setItem(STORAGE_KEYS.APPLY_DELIVERABLE_PRESET_ONCE, '1');
    } catch {
      // Ignore storage errors
    }

    try {
      const existingSessionRaw = localStorage.getItem(STORAGE_KEYS.CALCULATOR_SESSION);
      const existingSession = existingSessionRaw ? JSON.parse(existingSessionRaw) : {};

      const stripDeliverablesSummaryBlock = (notesText) => {
        const text = String(notesText || "");
        const marker = "Deliverables Estimator Summary:";
        const idx = text.indexOf(marker);
        if (idx === -1) return text.trim();

        const before = text.slice(0, idx).trimEnd();
        const cleaned = before.replace(/\n---\s*$/m, "").trimEnd();
        return cleaned.trim();
      };

      const existingBaseNotes = stripDeliverablesSummaryBlock(existingSession.notes_for_quote || "");

      const nextNotes = [
        existingBaseNotes,
        existingBaseNotes ? "---" : "",
        "Deliverables Estimator Summary:",
        `Category: ${computed.estimateSummary?.productionCategoryLabel || ""}`,
        `Scope: ${computed.estimateSummary?.executionScopeLabel || ""}`,
        `Post Requested: ${selections.postRequested ? "Yes" : "No"}`,
        "Deliverables:",
        ...(computed.estimateSummary?.deliverables || []).map(d => `- ${d.label} ×${d.quantity}`),
        (computed.estimateSummary?.modifiers?.length ? "Modifiers:" : ""),
        ...(computed.estimateSummary?.modifiers || []).map(m => `- ${m}`),
      ].filter(Boolean).join("\n").trim();

      const mergedSession = {
        ...existingSession,
        client_name: clientMeta.clientName || existingSession.client_name || "",
        project_title: clientMeta.projectName || existingSession.project_title || "",
        notes_for_quote: nextNotes
      };

      localStorage.setItem(STORAGE_KEYS.CALCULATOR_SESSION, JSON.stringify(mergedSession));
    } catch {
      // Ignore storage errors
    }

    toast({
      title: "Sent to Crew Calculator",
      description: "Your estimate is saved. Review crew pricing and export from the Crew Calculator.",
    });

    navigate(createPageUrl("Calculator"));
  };

  const handleExportQuote = () => {
    checkAccessAndProceed(() => {
      const { formData, calculations } = buildExportPayload();
      if (!calculations || !calculations.total) return;

      const enhancedExport = new EnhancedExportService(
        formData,
        calculations,
        [],
        [],
        settings,
        isUnlocked
      );

      const printWindow = window.open('', '', 'width=900,height=700');
      printWindow.document.write(enhancedExport.generateHTML('quote'));
      printWindow.document.close();

      toast({
        title: "Quote Exported",
        description: "Your professional quote is ready to print or save as PDF.",
      });
    });
  };

  const handleExportInvoice = () => {
    checkAccessAndProceed(() => {
      const { formData, calculations } = buildExportPayload();
      if (!calculations || !calculations.total) return;

      const enhancedExport = new EnhancedExportService(
        formData,
        calculations,
        [],
        [],
        settings,
        isUnlocked
      );

      const printWindow = window.open('', '', 'width=900,height=700');
      printWindow.document.write(enhancedExport.generateHTML('invoice'));
      printWindow.document.close();

      toast({
        title: "Invoice Exported",
        description: "Your professional invoice is ready to print or save as PDF.",
      });
    });
  };
  
  // Get filtered deliverables for selected category
  const availableDeliverables = useMemo(() => {
    return catalogData.deliverables.filter(
      d => d.categoryId === selections.productionCategoryId
    );
  }, [selections.productionCategoryId]);
  
  // Get visible modifiers
  const availableModifiers = useMemo(() => {
    return catalogData.modifiers.filter(
      m => m.visibility === "public" || selections.context.mode === "admin"
    );
  }, [selections.context.mode]);
  
  // Handle category change
  const handleCategoryChange = (categoryId) => {
    setSelections(prev => ({
      ...prev,
      productionCategoryId: categoryId,
      deliverables: [], // Clear deliverables when category changes
      customBaseDayRate: null // Reset custom rate to use new category's default
    }));
  };
  
  // Handle execution scope change
  const handleExecutionScopeChange = (scopeId) => {
    setSelections(prev => ({
      ...prev,
      executionScopeId: scopeId
    }));
  };
  
  // Handle deliverable toggle
  const handleDeliverableToggle = (deliverableId) => {
    setSelections(prev => {
      const delivDef = catalogData.deliverables.find(d => d.id === deliverableId);
      const requiredScopeId = delivDef?.constraints?.minExecutionScope || null;
      const requiresPost = Boolean(delivDef?.constraints?.requiresPost);

      const scopes = catalogData.executionScopes || [];
      const requiredScopeIndex = requiredScopeId
        ? scopes.findIndex(s => s.id === requiredScopeId)
        : -1;
      const currentScopeIndex = scopes.findIndex(s => s.id === prev.executionScopeId);

      const existing = prev.deliverables.find(d => d.deliverableId === deliverableId);
      
      if (existing) {
        // Remove
        return {
          ...prev,
          deliverables: prev.deliverables.filter(d => d.deliverableId !== deliverableId)
        };
      } else {
        if (requiredScopeIndex !== -1 && currentScopeIndex !== -1 && currentScopeIndex < requiredScopeIndex) {
          toast({
            title: "Execution Scope Updated",
            description: `"${delivDef?.labelEstimate || 'This deliverable'}" requires ${requiredScopeId.replace(/_/g, ' ')}. Scope updated automatically.`,
          });
        }

        if (requiresPost && !prev.postRequested) {
          toast({
            title: "Post-Production Enabled",
            description: `"${delivDef?.labelEstimate || 'This deliverable'}" requires post-production. Enabled automatically.`,
          });
        }

        // Add with quantity 1 and default rate from catalog
        return {
          ...prev,
          executionScopeId:
            (requiredScopeIndex !== -1 && currentScopeIndex !== -1 && currentScopeIndex < requiredScopeIndex)
              ? requiredScopeId
              : prev.executionScopeId,
          postRequested: requiresPost ? true : prev.postRequested,
          deliverables: [...prev.deliverables, { 
            deliverableId, 
            quantity: 1,
            customRate: null // null means use default catalog rate
          }]
        };
      }
    });
  };
  
  // Handle deliverable quantity change
  const handleDeliverableQuantityChange = (deliverableId, delta) => {
    setSelections(prev => ({
      ...prev,
      deliverables: prev.deliverables.map(d => {
        if (d.deliverableId === deliverableId) {
          const newQty = Math.max(1, d.quantity + delta);
          return { ...d, quantity: newQty };
        }
        return d;
      })
    }));
  };
  
  // Handle deliverable custom rate change
  const handleDeliverableRateChange = (deliverableId, newRate) => {
    setSelections(prev => ({
      ...prev,
      deliverables: prev.deliverables.map(d => {
        if (d.deliverableId === deliverableId) {
          // If empty or 0, set to null to use default
          const rate = newRate === '' || newRate === 0 ? null : parseFloat(newRate) || null;
          return { ...d, customRate: rate };
        }
        return d;
      })
    }));
  };
  
  // Handle modifier toggle
  const handleModifierToggle = (modifierId) => {
    setSelections(prev => {
      const existing = prev.modifiers.find(m => m.modifierId === modifierId);
      
      if (existing) {
        // Remove
        return {
          ...prev,
          modifiers: prev.modifiers.filter(m => m.modifierId !== modifierId)
        };
      } else {
        // Add with quantity 1
        return {
          ...prev,
          modifiers: [...prev.modifiers, { modifierId, quantity: 1 }]
        };
      }
    });
  };
  
  // Handle reset
  const handleReset = () => {
    setSelections({
      productionCategoryId: "content_creation",
      executionScopeId: "capture_only",
      productionDays: 1,
      postRequested: false,
      deliverables: [],
      modifiers: [],
      context: { mode: "public" }
    });
    setClientMeta({
      clientName: "",
      projectName: "",
      notes: ""
    });
    toast({
      title: "Calculator Reset",
      description: "All fields have been reset to defaults."
    });
  };
  
  // Check if deliverable is selected
  const isDeliverableSelected = (deliverableId) => {
    return selections.deliverables.some(d => d.deliverableId === deliverableId);
  };
  
  // Get deliverable quantity
  const getDeliverableQuantity = (deliverableId) => {
    const deliv = selections.deliverables.find(d => d.deliverableId === deliverableId);
    return deliv?.quantity || 1;
  };
  
  // Get deliverable custom rate (or null if using default)
  const getDeliverableCustomRate = (deliverableId) => {
    const deliv = selections.deliverables.find(d => d.deliverableId === deliverableId);
    return deliv?.customRate ?? null;
  };
  
  // Check if modifier is selected
  const isModifierSelected = (modifierId) => {
    return selections.modifiers.some(m => m.modifierId === modifierId);
  };

  const getDeliverableSubtext = (delivDef) => {
    if (!delivDef) return '';

    if (delivDef?.constraints?.requiresPost) {
      return 'Final edit, formatted and delivered';
    }

    if (selections.workType === 'capture_only' && !selections.postRequested) {
      return 'Capture only. No edit unless selected.';
    }

    return 'Finished outcome, formatted and delivered';
  };
  
  return (
    <div className="min-h-screen p-6" style={{ background: 'var(--color-bg-primary)' }}>
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2" style={{ color: 'var(--color-text-primary)' }}>
            Deliverables Pricing
          </h1>
          <p style={{ color: 'var(--color-text-secondary)' }}>
            Subject-based pricing for solo operators.
          </p>
          <p className="mt-2" style={{ color: 'var(--color-text-muted)' }}>
            This page defines what you deliver — and what costs extra.
          </p>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Form */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Client Info */}
            <Card style={cardStyle}>
              <CardHeader>
                <CardTitle>Project Context</CardTitle>
                <p className="text-sm mt-1" style={{ color: 'var(--color-text-secondary)' }}>
                  This information anchors the scope. It does not affect pricing.
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Client Name</Label>
                  <Input
                    value={clientMeta.clientName}
                    onChange={(e) => setClientMeta(prev => ({ ...prev, clientName: e.target.value }))}
                    placeholder="Enter client name"
                  />
                </div>
                <div>
                  <Label>Project Name</Label>
                  <Input
                    value={clientMeta.projectName}
                    onChange={(e) => setClientMeta(prev => ({ ...prev, projectName: e.target.value }))}
                    placeholder="Enter project name"
                  />
                </div>
              </CardContent>
            </Card>
            
            {/* Work Type - Primary Mode Selector */}
            <Card style={cardStyle}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="w-5 h-5" />
                  Delivery Type
                </CardTitle>
                <p className="text-sm mt-1" style={{ color: 'var(--color-text-secondary)' }}>
                  This determines how responsibility is handled.
                </p>
              </CardHeader>
              <CardContent className="space-y-3">
                {/* Work Type Options */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {/* Post-Production Only */}
                  <div 
                    className={`p-4 rounded-lg border-2 cursor-pointer transition-all`}
                    style={{ 
                      background: selections.workType === 'post_only' ? 'rgba(37, 99, 235, 0.05)' : 'var(--color-bg-secondary)',
                      border: selections.workType === 'post_only' ? '2px solid var(--color-accent-primary)' : '1px solid var(--color-border)'
                    }}
                    onClick={() => setSelections(prev => ({
                      ...prev,
                      workType: 'post_only',
                      includeProductionDays: false,
                      productionDays: 0,
                      postRequested: true,
                      executionScopeId: 'capture_only'
                    }))}
                  >
                    <div className="text-center">
                      <div className="font-semibold">Post-Production Only</div>
                      <p className="text-xs mt-1" style={{ color: 'var(--color-text-secondary)' }}>
                        You are delivering edits, not capture.
                      </p>
                    </div>
                  </div>
                  
                  {/* Capture + Delivery */}
                  <div 
                    className={`p-4 rounded-lg border-2 cursor-pointer transition-all`}
                    style={{ 
                      background: selections.workType === 'capture_only' ? 'rgba(37, 99, 235, 0.05)' : 'var(--color-bg-secondary)',
                      border: selections.workType === 'capture_only' ? '2px solid var(--color-accent-primary)' : '1px solid var(--color-border)'
                    }}
                    onClick={() => setSelections(prev => ({
                      ...prev,
                      workType: 'capture_only',
                      includeProductionDays: true,
                      productionDays: prev.productionDays || 1,
                      postRequested: false,
                      executionScopeId: 'capture_only'
                    }))}
                  >
                    <div className="text-center">
                      <div className="font-semibold">Capture + Delivery</div>
                      <p className="text-xs mt-1" style={{ color: 'var(--color-text-secondary)' }}>
                        You shoot efficiently and deliver final assets.
                      </p>
                    </div>
                  </div>
                  
                  {/* Turnkey Delivery */}
                  <div 
                    className={`p-4 rounded-lg border-2 cursor-pointer transition-all`}
                    style={{ 
                      background: selections.workType === 'full_production' ? 'rgba(37, 99, 235, 0.05)' : 'var(--color-bg-secondary)',
                      border: selections.workType === 'full_production' ? '2px solid var(--color-accent-primary)' : '1px solid var(--color-border)'
                    }}
                    onClick={() => setSelections(prev => ({
                      ...prev,
                      workType: 'full_production',
                      includeProductionDays: true,
                      productionDays: prev.productionDays || 1,
                      postRequested: true,
                      executionScopeId: 'directed_production'
                    }))}
                  >
                    <div className="text-center">
                      <div className="font-semibold">Turnkey Delivery</div>
                      <p className="text-xs mt-1" style={{ color: 'var(--color-text-secondary)' }}>
                        You control capture, edit, and outcome.
                      </p>
                    </div>
                  </div>
                </div>

                <Separator className="my-4" />

                {/* Production Days - only show if shooting */}
                {selections.includeProductionDays && (
                  <div className="flex items-center justify-between p-3 rounded-lg" style={{ background: 'var(--color-bg-tertiary)' }}>
                    <div>
                      <Label>Production Days</Label>
                      <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                        How many days on set?
                      </p>
                    </div>
                    <Input
                      type="number"
                      min="0.5"
                      step="0.5"
                      value={selections.productionDays}
                      onChange={(e) => setSelections(prev => ({
                        ...prev,
                        productionDays: parseFloat(e.target.value) || 0
                      }))}
                      className="w-24 text-center"
                    />
                  </div>
                )}

                {/* Creative Direction Level - only show if shooting */}
                {selections.includeProductionDays && (
                  <div className="space-y-2">
                    <Label>Creative Direction Level</Label>
                    <div className="grid grid-cols-1 gap-2">
                      {catalogData.executionScopes.map(scope => {
                        const isSelected = selections.executionScopeId === scope.id;
                        return (
                          <div 
                            key={scope.id}
                            className={`p-3 rounded-lg border cursor-pointer transition-all`}
                            style={{ 
                              background: isSelected ? 'rgba(37, 99, 235, 0.05)' : 'transparent',
                              border: isSelected ? '2px solid var(--color-accent-primary)' : '1px solid var(--color-border)'
                            }}
                            onClick={() => handleExecutionScopeChange(scope.id)}
                          >
                            <div className="flex items-center justify-between">
                              <div>
                                <span className="font-medium">{scope.labelEstimate}</span>
                                <span className="text-xs ml-2" style={{ color: 'var(--color-text-muted)' }}>
                                  {scope.responsibilityLevel === "client-led" && "— Client directs"}
                                  {scope.responsibilityLevel === "shared" && "— Collaborative"}
                                  {scope.responsibilityLevel === "vendor-led" && "— You lead"}
                                </span>
                              </div>
                              {isUnlocked && scope.perDayAdd > 0 && (
                                <span className="text-sm font-medium" style={{ color: 'var(--color-accent-primary)' }}>
                                  +${selections.customScopeRates?.[scope.id] ?? scope.perDayAdd}/day
                                </span>
                              )}
                              {scope.perDayAdd === 0 && (
                                <span className="text-xs" style={{ color: 'var(--color-success)' }}>Included</span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
            
            {/* Layer 1: Production Category - Only show when production days are enabled */}
            {selections.includeProductionDays && (
              <Card style={cardStyle}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Package className="w-5 h-5" />
                    Production Category
                  </CardTitle>
                  <p className="text-sm mt-1" style={{ color: 'var(--color-text-secondary)' }}>
                    Select the type of production — each has industry-standard base rates
                  </p>
                </CardHeader>
                <CardContent className="space-y-3">
                  <RadioGroup value={selections.productionCategoryId} onValueChange={handleCategoryChange}>
                    {catalogData.productionCategories.map(cat => {
                      const isSelected = selections.productionCategoryId === cat.id;
                      return (
                        <div 
                          key={cat.id} 
                          className={`p-4 rounded-lg border-2 transition-all cursor-pointer`}
                          style={{ 
                            background: isSelected ? 'rgba(37, 99, 235, 0.05)' : 'var(--color-bg-secondary)',
                            border: isSelected ? '2px solid var(--color-accent-primary)' : '1px solid var(--color-border)'
                          }}
                          onClick={() => handleCategoryChange(cat.id)}
                        >
                          <div className="flex items-start space-x-3">
                            <RadioGroupItem value={cat.id} id={cat.id} className="mt-1" />
                            <div className="flex-1">
                              <Label htmlFor={cat.id} className="cursor-pointer font-semibold text-base">
                                {cat.label}
                              </Label>
                              {cat.description && (
                                <p className="text-sm mt-1" style={{ color: 'var(--color-text-secondary)' }}>
                                  {cat.description}
                                </p>
                              )}
                              {isUnlocked && isSelected && cat.baseDayRate && (
                                <div className="mt-2 flex items-center gap-2">
                                  <span className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>
                                    Base Day Rate:
                                  </span>
                                  <div className="flex items-center gap-1">
                                    <span className="text-sm" style={{ color: 'var(--color-text-muted)' }}>$</span>
                                    <Input
                                      type="number"
                                      min="0"
                                      step="100"
                                      value={selections.customBaseDayRate ?? cat.baseDayRate}
                                      onChange={(e) => {
                                        const val = parseFloat(e.target.value) || 0;
                                        setSelections(prev => ({
                                          ...prev,
                                          customBaseDayRate: val
                                        }));
                                      }}
                                      onClick={(e) => e.stopPropagation()}
                                      className="w-24 h-8 text-sm text-center"
                                      style={{ padding: '4px 8px' }}
                                    />
                                    <span className="text-sm" style={{ color: 'var(--color-text-muted)' }}>/day</span>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </RadioGroup>
                </CardContent>
              </Card>
            )}
            
            {/* Layer 2: Deliverables */}
            <Card style={cardStyle}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Video className="w-5 h-5" />
                  What You Are Delivering
                </CardTitle>
                <p className="text-sm mt-1" style={{ color: 'var(--color-text-secondary)' }}>
                  Each item represents a finished outcome, not time spent.
                </p>
              </CardHeader>
              <CardContent className="space-y-3">
                {availableDeliverables.length === 0 && (
                  <p style={{ color: 'var(--color-text-secondary)' }}>
                    No deliverables available for this category.
                  </p>
                )}
                {availableDeliverables.map(deliv => {
                  const isSelected = isDeliverableSelected(deliv.id);
                  const quantity = getDeliverableQuantity(deliv.id);
                  const deliverableSubtext = getDeliverableSubtext(deliv);
                  
                  return (
                    <div key={deliv.id} className="flex items-center justify-between p-3 rounded-lg border">
                      <div className="flex items-center gap-3 flex-1">
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={() => handleDeliverableToggle(deliv.id)}
                        />
                        <div className="flex-1">
                          <div className="font-medium">{deliv.labelEstimate}</div>
                          <div className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                            {isUnlocked ? `$${deliv.unitPrice} per ${deliv.unit}` : ''}
                          </div>
                          {deliverableSubtext && (
                            <div className="text-xs mt-1" style={{ color: 'var(--color-text-muted)' }}>
                              {deliverableSubtext}
                            </div>
                          )}
                        </div>
                      </div>
                      
                      {isSelected && (
                        <div className="flex items-center gap-3">
                          {/* Quantity controls */}
                          <div className="flex items-center gap-1">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDeliverableQuantityChange(deliv.id, -1)}
                              disabled={quantity <= 1}
                            >
                              <Minus className="w-4 h-4" />
                            </Button>
                            <span className="w-8 text-center font-medium">{quantity}</span>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDeliverableQuantityChange(deliv.id, 1)}
                            >
                              <Plus className="w-4 h-4" />
                            </Button>
                          </div>
                          
                          {/* Custom rate input */}
                          {isUnlocked && (
                            <div className="flex items-center gap-1">
                              <span className="text-sm" style={{ color: 'var(--color-text-muted)' }}>$</span>
                              <Input
                                type="number"
                                min="0"
                                step="25"
                                placeholder={deliv.unitPrice.toString()}
                                value={getDeliverableCustomRate(deliv.id) ?? ''}
                                onChange={(e) => handleDeliverableRateChange(deliv.id, e.target.value)}
                                className="w-20 h-8 text-sm text-center"
                                style={{ padding: '4px 8px' }}
                              />
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </CardContent>
            </Card>
            
            
            {/* Layer 4: Modifiers */}
            <Card style={cardStyle}>
              <CardHeader>
                <CardTitle>Scope Add-Ons</CardTitle>
                <p className="text-sm mt-1" style={{ color: 'var(--color-text-secondary)' }}>
                  These increase complexity, not quality.
                </p>
              </CardHeader>
              <CardContent className="space-y-3">
                {availableModifiers.map(mod => {
                  const isSelected = isModifierSelected(mod.id);
                  const isDisabled = mod.requiresPostRequested && !selections.postRequested;
                  
                  return (
                    <div 
                      key={mod.id} 
                      className={`flex items-center justify-between p-3 rounded-lg border ${isDisabled ? 'opacity-50' : ''}`}
                    >
                      <div className="flex items-center gap-3 flex-1">
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={() => handleModifierToggle(mod.id)}
                          disabled={isDisabled}
                        />
                        <div className="flex-1">
                          <div className="font-medium">{mod.labelEstimate}</div>
                          <div className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                            {mod.pricing.type === "fixed" && (isUnlocked ? `$${mod.pricing.value}` : '')}
                            {isUnlocked && mod.pricing.type === "multiplier" && `${((mod.pricing.value - 1) * 100).toFixed(0)}% increase`}
                            {isDisabled && " • Requires post-production"}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
            
            <div className="flex gap-3">
              <Button onClick={handleReset} variant="outline">
                <RotateCcw className="w-4 h-4 mr-2" />
                Reset
              </Button>
            </div>
          </div>
          
          {/* Right Column - Live Totals */}
          <div className="lg:col-span-1">
            <div className="sticky top-6 space-y-6">
              
              {!isUnlocked && (
                <Card style={cardStyle}>
                  <CardHeader>
                    <CardTitle>Ledger access required</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                      Recording pricing decisions requires access.
                    </div>
                    <Button className="w-full" onClick={() => navigate(createPageUrl("Unlock"))}>
                      Enable recording
                    </Button>
                  </CardContent>
                </Card>
              )}
              
              {/* Estimate Summary */}
              <Card style={cardStyle}>
                <CardHeader>
                  <CardTitle>Estimate Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {quote.computed.estimateSummary && (
                    <>
                      <div>
                        <div className="text-sm font-medium" style={{ color: 'var(--color-text-secondary)' }}>
                          Production Category
                        </div>
                        <div className="font-medium">
                          {quote.computed.estimateSummary.productionCategoryLabel}
                        </div>
                      </div>
                      
                      <Separator />
                      
                      <div>
                        <div className="text-sm font-medium mb-2" style={{ color: 'var(--color-text-secondary)' }}>
                          Deliverables
                        </div>
                        {quote.computed.estimateSummary.deliverables.length === 0 ? (
                          <div className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                            No deliverables selected
                          </div>
                        ) : (
                          <ul className="space-y-1">
                            {quote.computed.estimateSummary.deliverables.map((d, i) => (
                              <li key={i} className="text-sm">
                                • {d.label} x{d.quantity}
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                      
                      <Separator />
                      
                      <div>
                        <div className="text-sm font-medium" style={{ color: 'var(--color-text-secondary)' }}>
                          Execution Scope
                        </div>
                        <div className="font-medium">
                          {quote.computed.estimateSummary.executionScopeLabel}
                        </div>
                      </div>
                      
                      {quote.computed.estimateSummary.modifiers.length > 0 && (
                        <>
                          <Separator />
                          <div>
                            <div className="text-sm font-medium mb-2" style={{ color: 'var(--color-text-secondary)' }}>
                              Modifiers
                            </div>
                            <ul className="space-y-1">
                              {quote.computed.estimateSummary.modifiers.map((m, i) => (
                                <li key={i} className="text-sm">• {m}</li>
                              ))}
                            </ul>
                          </div>
                        </>
                      )}
                    </>
                  )}
                </CardContent>
              </Card>
              
              {isUnlocked && (
                <>
                  {/* Pricing Breakdown */}
                  <Card style={cardStyle}>
                    <CardHeader>
                      <CardTitle>Scope Summary</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {(() => {
                        const computed = quote?.computed;
                        const pricing = computed?.pricing;
                        const lineItems = computed?.lineItems || [];

                        const scopeAddOns = lineItems
                          .filter(li => li?.kind === 'modifier_fixed')
                          .reduce((sum, li) => sum + (typeof li.amount === 'number' ? li.amount : 0), 0);

                        const deliverablesTotal = Math.max(0, (pricing?.subtotalAfterFloor || 0) - scopeAddOns);
                        const complexityMultiplier = pricing?.scopedMultiplier?.multiplierAmount || 0;
                        const scopeLockedTotal = pricing?.total || 0;

                        const formatMoney = (value) => Number(value || 0).toLocaleString();

                        return (
                          <>
                            <div className="flex items-start justify-between gap-4">
                              <div>
                                <div className="text-sm font-medium" style={{ color: 'var(--color-text-secondary)' }}>Deliverables Total</div>
                                <div className="text-xs mt-1" style={{ color: 'var(--color-text-muted)' }}>What you are delivering.</div>
                                <div className="text-xs mt-1" style={{ color: 'var(--color-text-muted)' }}>This is the sum of defined deliverables only.</div>
                                <div className="text-xs mt-1" style={{ color: 'var(--color-text-muted)' }}>No assumptions. No extras.</div>
                              </div>
                              <div className="text-sm font-medium" style={{ color: 'var(--color-text-primary)', fontVariantNumeric: 'tabular-nums' }}>
                                ${formatMoney(deliverablesTotal)}
                              </div>
                            </div>

                            <div className="flex items-start justify-between gap-4">
                              <div>
                                <div className="text-sm font-medium" style={{ color: 'var(--color-text-secondary)' }}>Scope Add-Ons</div>
                                <div className="text-xs mt-1" style={{ color: 'var(--color-text-muted)' }}>What expands responsibility.</div>
                                <div className="text-xs mt-1" style={{ color: 'var(--color-text-muted)' }}>These increase complexity, not quality.</div>
                              </div>
                              <div className="text-sm font-medium" style={{ color: 'var(--color-text-primary)', fontVariantNumeric: 'tabular-nums' }}>
                                ${formatMoney(scopeAddOns)}
                              </div>
                            </div>

                            <div className="flex items-start justify-between gap-4">
                              <div>
                                <div className="text-sm font-medium" style={{ color: 'var(--color-text-secondary)' }}>Complexity Multiplier</div>
                                <div className="text-xs mt-1" style={{ color: 'var(--color-text-muted)' }}>How demanding this scope is.</div>
                                <div className="text-xs mt-1" style={{ color: 'var(--color-text-muted)' }}>Applied based on delivery pressure, constraints, and risk.</div>
                              </div>
                              <div className="text-sm font-medium" style={{ color: 'var(--color-text-primary)', fontVariantNumeric: 'tabular-nums' }}>
                                ${formatMoney(complexityMultiplier)}
                              </div>
                            </div>

                            <Separator />

                            <div className="flex items-start justify-between gap-4">
                              <div>
                                <div className="text-lg font-bold">Scope-Locked Total</div>
                                <div className="text-xs mt-1" style={{ color: 'var(--color-text-muted)' }}>This price reflects the scope as defined above.</div>
                              </div>
                              <div className="text-lg font-bold" style={{ color: 'var(--color-accent-primary)', fontVariantNumeric: 'tabular-nums' }}>
                                ${formatMoney(scopeLockedTotal)}
                              </div>
                            </div>

                            <div className="text-xs mt-2" style={{ color: 'var(--color-text-muted)' }}>
                              Changes to scope require a new quote.
                            </div>
                          </>
                        );
                      })()}
                    </CardContent>
                  </Card>
                </>
              )}
              
              {/* Warnings */}
              {quote.computed.warnings.length > 0 && (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    <div className="space-y-2">
                      {quote.computed.warnings.map((warning, i) => (
                        <div key={i} className="text-sm">
                          {warning.message}
                        </div>
                      ))}
                    </div>
                  </AlertDescription>
                </Alert>
              )}
              
              {/* Validation Errors */}
              {quote.computed.validations.length > 0 && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    <div className="space-y-2">
                      {quote.computed.validations.map((validation, i) => (
                        <div key={i} className="text-sm">
                          {validation.message}
                        </div>
                      ))}
                    </div>
                  </AlertDescription>
                </Alert>
              )}
              
              {isUnlocked && (
                <>
                  {/* Export Actions */}
                  <Card style={cardStyle}>
                    <CardContent className="pt-6 space-y-3">
                      <Button className="w-full" variant="outline" disabled={hasCalculationError} onClick={() => checkAccessAndProceed(persistEstimateAndGoToCrew)}>
                        <ArrowRight className="w-4 h-4 mr-2" />
                        Use in Crew Calculator
                      </Button>
                      <Button className="w-full" disabled={selections.deliverables.length === 0} onClick={handleExportQuote}>
                        <Download className="w-4 h-4 mr-2" />
                        Generate Scope-Locked Quote
                      </Button>
                      <Button className="w-full" variant="outline" disabled={selections.deliverables.length === 0} onClick={handleExportInvoice}>
                        <Download className="w-4 h-4 mr-2" />
                        Generate Scope-Locked Invoice
                      </Button>
                    </CardContent>
                  </Card>

                  <div className="text-sm mt-1" style={{ color: 'var(--color-text-muted)' }}>
                    Clear deliverables prevent burnout.
                    <br />
                    Clear pricing prevents resentment.
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
