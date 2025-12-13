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
  
  // Form state matching the schema
  const [selections, setSelections] = useState({
    productionCategoryId: "content_creation",
    executionScopeId: "capture_only",
    productionDays: 1,
    postRequested: false,
    deliverables: [],
    modifiers: [],
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
        title: "Unlock Required",
        description: "Unlock to view Deliverables pricing and export quotes.",
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
          amount: li.amount,
        })),
        total,
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
      deliverables: [] // Clear deliverables when category changes
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
      const existing = prev.deliverables.find(d => d.deliverableId === deliverableId);
      
      if (existing) {
        // Remove
        return {
          ...prev,
          deliverables: prev.deliverables.filter(d => d.deliverableId !== deliverableId)
        };
      } else {
        // Add with quantity 1
        return {
          ...prev,
          deliverables: [...prev.deliverables, { deliverableId, quantity: 1 }]
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
  
  // Check if modifier is selected
  const isModifierSelected = (modifierId) => {
    return selections.modifiers.some(m => m.modifierId === modifierId);
  };
  
  return (
    <div className="min-h-screen p-6" style={{ background: 'var(--color-bg-primary)' }}>
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2" style={{ color: 'var(--color-text-primary)' }}>
            Deliverable-Based Quote Calculator
          </h1>
          <p style={{ color: 'var(--color-text-secondary)' }}>
            Professional video production pricing based on deliverables, scope, and responsibility
          </p>
          <Alert className="mt-4" style={{ background: 'var(--color-bg-tertiary)', borderColor: 'var(--color-border-light)' }}>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription style={{ color: 'var(--color-text-secondary)' }}>
              <strong>Quick Estimate Tool:</strong> This calculator provides general rate estimates. When you proceed to the Crew Calculator, you'll use your own custom rates and pricing - not the deliverable calculator's estimates.
            </AlertDescription>
          </Alert>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Form */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Client Info */}
            <Card>
              <CardHeader>
                <CardTitle>Client Information</CardTitle>
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
            
            {/* Layer 1: Production Category */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="w-5 h-5" />
                  Production Category
                </CardTitle>
              </CardHeader>
              <CardContent>
                <RadioGroup value={selections.productionCategoryId} onValueChange={handleCategoryChange}>
                  {catalogData.productionCategories.map(cat => (
                    <div key={cat.id} className="flex items-center space-x-2">
                      <RadioGroupItem value={cat.id} id={cat.id} />
                      <Label htmlFor={cat.id} className="cursor-pointer">{cat.label}</Label>
                    </div>
                  ))}
                </RadioGroup>
              </CardContent>
            </Card>
            
            {/* Layer 2: Deliverables */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Video className="w-5 h-5" />
                  Deliverables
                </CardTitle>
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
                        </div>
                      </div>
                      
                      {isSelected && (
                        <div className="flex items-center gap-2">
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
                      )}
                    </div>
                  );
                })}
              </CardContent>
            </Card>
            
            {/* Layer 3: Execution Scope */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="w-5 h-5" />
                  Execution Scope (Required)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <RadioGroup value={selections.executionScopeId} onValueChange={handleExecutionScopeChange}>
                  {catalogData.executionScopes.map(scope => (
                    <div key={scope.id} className="flex items-start space-x-2 p-3 rounded-lg border">
                      <RadioGroupItem value={scope.id} id={scope.id} className="mt-1" />
                      <div className="flex-1">
                        <Label htmlFor={scope.id} className="cursor-pointer font-medium">
                          {scope.labelEstimate}
                        </Label>
                        <div className="text-sm mt-1" style={{ color: 'var(--color-text-secondary)' }}>
                          {scope.responsibilityLevel === "client-led" && "Client-led production"}
                          {scope.responsibilityLevel === "shared" && "Shared responsibility"}
                          {scope.responsibilityLevel === "vendor-led" && "Full vendor responsibility"}
                          {isUnlocked && scope.perDayAdd > 0 && ` • +$${scope.perDayAdd}/day`}
                        </div>
                      </div>
                    </div>
                  ))}
                </RadioGroup>
              </CardContent>
            </Card>
            
            {/* Production Settings */}
            <Card>
              <CardHeader>
                <CardTitle>Production Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Production Days</Label>
                  <Input
                    type="number"
                    min="0"
                    step="0.5"
                    value={selections.productionDays}
                    onChange={(e) => setSelections(prev => ({
                      ...prev,
                      productionDays: parseFloat(e.target.value) || 0
                    }))}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Post-Production Required</Label>
                    <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                      Enable editing and post-production services
                    </p>
                  </div>
                  <Switch
                    checked={selections.postRequested}
                    onCheckedChange={(checked) => setSelections(prev => ({
                      ...prev,
                      postRequested: checked
                    }))}
                  />
                </div>
              </CardContent>
            </Card>
            
            {/* Layer 4: Modifiers */}
            <Card>
              <CardHeader>
                <CardTitle>Production Modifiers</CardTitle>
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
                <Card>
                  <CardHeader>
                    <CardTitle>Unlock to Continue</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                      Purchase/unlock to view deliverables pricing and export quotes.
                    </div>
                    <Button className="w-full" onClick={() => navigate(createPageUrl("Unlock"))}>
                      Unlock / Purchase
                    </Button>
                  </CardContent>
                </Card>
              )}
              
              {/* Estimate Summary */}
              <Card>
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
                  <Card>
                    <CardHeader>
                      <CardTitle>Pricing</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex justify-between text-sm">
                        <span style={{ color: 'var(--color-text-secondary)' }}>Subtotal</span>
                        <span className="font-medium">
                          ${quote.computed.pricing.subtotalBeforeFloor.toLocaleString()}
                        </span>
                      </div>
                      
                      {quote.computed.pricing.priceFloorAdded > 0 && (
                        <div className="flex justify-between text-sm">
                          <span style={{ color: 'var(--color-text-secondary)' }}>Minimum Engagement</span>
                          <span className="font-medium" style={{ color: 'var(--color-accent-primary)' }}>
                            +${quote.computed.pricing.priceFloorAdded.toLocaleString()}
                          </span>
                        </div>
                      )}
                      
                      {quote.computed.pricing.scopedMultiplier.multiplier > 1.0 && (
                        <div className="flex justify-between text-sm">
                          <span style={{ color: 'var(--color-text-secondary)' }}>
                            Risk Multiplier ({((quote.computed.pricing.scopedMultiplier.multiplier - 1) * 100).toFixed(0)}%)
                          </span>
                          <span className="font-medium" style={{ color: 'var(--color-accent-primary)' }}>
                            +${quote.computed.pricing.scopedMultiplier.multiplierAmount.toLocaleString()}
                          </span>
                        </div>
                      )}
                      
                      <Separator />
                      
                      <div className="flex justify-between text-lg font-bold">
                        <span>Total</span>
                        <span style={{ color: 'var(--color-accent-primary)' }}>
                          ${quote.computed.pricing.total.toLocaleString()}
                        </span>
                      </div>
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
                  <Card>
                    <CardContent className="pt-6 space-y-3">
                      <Button className="w-full" variant="outline" disabled={hasCalculationError} onClick={() => checkAccessAndProceed(persistEstimateAndGoToCrew)}>
                        <ArrowRight className="w-4 h-4 mr-2" />
                        Use in Crew Calculator
                      </Button>
                      <Button className="w-full" disabled={selections.deliverables.length === 0} onClick={handleExportQuote}>
                        <Download className="w-4 h-4 mr-2" />
                        Export Quote
                      </Button>
                      <Button className="w-full" variant="outline" disabled={selections.deliverables.length === 0} onClick={handleExportInvoice}>
                        <Download className="w-4 h-4 mr-2" />
                        Export Invoice
                      </Button>
                    </CardContent>
                  </Card>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
