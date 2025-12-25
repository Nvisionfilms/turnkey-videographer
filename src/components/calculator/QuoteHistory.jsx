import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { History, Trash2, FileText, DollarSign } from "lucide-react";
import { format } from "date-fns";

const STORAGE_KEY = 'quote_history';

const QuoteHistory = React.forwardRef(({ onLoadQuote }, ref) => {
  const [quotes, setQuotes] = useState([]);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    loadQuotes();
  }, []);

  const loadQuotes = () => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        setQuotes(JSON.parse(saved));
      }
    } catch (error) {
      console.error('Error loading quote history:', error);
    }
  };

  const saveQuote = (quoteData, calculations, settings, status = 'UNFINALIZED') => {
    try {
      const now = new Date().toISOString();
      
      // Build calculation snapshot from calculations object
      const calculationSnapshot = {
        calculated_at: now,
        line_items: (calculations?.lineItems || []).map((item, idx) => ({
          id: `li_${idx}`,
          label: item.description || '',
          type: item.isSection ? 'SECTION' : 'DECISION',
          category: item.category || 'OTHER',
          quantity: item.quantity || 1,
          rate: item.unitPrice || item.amount || 0,
          total: item.amount || 0
        })),
        bases: {
          labor_base_amount: calculations?.laborBase || 0,
          labor_raw_amount: calculations?.laborRaw || 0
        },
        derived: {
          overhead_percent: settings?.overhead_percent || 0,
          profit_margin_percent: settings?.profit_margin_percent || 0,
          effective_percent: (settings?.overhead_percent || 0) + (settings?.profit_margin_percent || 0),
          overhead_margin_amount: (calculations?.overhead || 0) + (calculations?.profitMargin || 0)
        },
        totals: {
          subtotal: calculations?.subtotal || 0,
          tax_amount: calculations?.tax || 0,
          final_decision: calculations?.total || 0
        }
      };
      
      // Build settings snapshot
      const settingsSnapshot = {
        show_overhead_margin_line: settings?.show_service_fee_on_invoice !== false,
        overhead_percent: settings?.overhead_percent || 0,
        profit_margin_percent: settings?.profit_margin_percent || 0,
        tax_percent: settings?.tax_rate_percent || 0,
        currency: 'USD'
      };
      
      const newQuote = {
        id: Date.now().toString(),
        created_at: now,
        updated_at: now,
        status: status,
        client: {
          name: quoteData.client_name || 'Unnamed Client',
          project_title: quoteData.project_title || 'Untitled Project'
        },
        formData: quoteData,
        settings_snapshot: settingsSnapshot,
        calculation_snapshot: calculationSnapshot,
        // Legacy fields for backward compatibility
        client_name: quoteData.client_name || 'Unnamed Client',
        project_title: quoteData.project_title || 'Untitled Project',
        total: calculations?.total || 0,
        timestamp: now
      };
      
      // If finalizing, add finalized_at and lock
      if (status === 'FINAL') {
        newQuote.finalized_at = now;
      }

      const existing = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
      const updated = [newQuote, ...existing].slice(0, 20); // Keep last 20
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      setQuotes(updated);
      
      return newQuote;
    } catch (error) {
      console.error('Error saving quote:', error);
      return null;
    }
  };

  const deleteQuote = (id) => {
    try {
      const updated = quotes.filter(q => q.id !== id);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      setQuotes(updated);
    } catch (error) {
      console.error('Error deleting quote:', error);
    }
  };

  const clearAll = () => {
    if (confirm('Are you sure you want to clear all quote history?')) {
      localStorage.removeItem(STORAGE_KEY);
      setQuotes([]);
    }
  };

  // Expose saveQuote function to parent
  React.useImperativeHandle(ref, () => ({
    saveQuote
  }));

  return (
    <>
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            style={{ background: 'var(--color-bg-tertiary)', color: 'var(--color-text-primary)', borderColor: 'var(--color-border-light)' }}
          >
            <History className="w-4 h-4 mr-2" />
            Quote History ({quotes.length})
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto" style={{ background: 'var(--color-bg-secondary)', borderColor: 'var(--color-border)' }}>
          <DialogHeader>
            <DialogTitle style={{ color: 'var(--color-text-primary)' }}>Quote History</DialogTitle>
          </DialogHeader>
          
          {quotes.length === 0 ? (
            <div className="text-center py-8" style={{ color: 'var(--color-text-muted)' }}>
              <History className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No saved quotes yet</p>
              <p className="text-sm mt-1">Quotes are automatically saved when you export or print</p>
            </div>
          ) : (
            <div className="space-y-3">
              {quotes.map((quote) => (
                <Card key={quote.id} className="hover:shadow-md transition-shadow" style={{ background: 'var(--color-bg-primary)', borderColor: 'var(--color-border)' }}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <FileText className="w-4 h-4" style={{ color: 'var(--color-accent-primary)' }} />
                          <h4 className="font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                            {quote.client_name}
                          </h4>
                        </div>
                        <p className="text-sm mb-2" style={{ color: 'var(--color-text-secondary)' }}>
                          {quote.project_title}
                        </p>
                        <div className="flex items-center gap-4 text-xs" style={{ color: 'var(--color-text-muted)' }}>
                          <span>{format(new Date(quote.timestamp), 'MMM d, yyyy h:mm a')}</span>
                          <span className="flex items-center gap-1">
                            <DollarSign className="w-3 h-3" />
                            {quote.total?.toLocaleString()}
                          </span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            onLoadQuote(quote.formData);
                            setIsOpen(false);
                          }}
                          style={{ color: 'var(--color-accent-primary)' }}
                        >
                          Load
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteQuote(quote.id)}
                          style={{ color: 'var(--color-error)' }}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              
              {quotes.length > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={clearAll}
                  style={{ color: 'var(--color-text-muted)', borderColor: 'var(--color-border)' }}
                >
                  Clear All History
                </Button>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
      
      {/* Expose saveQuote method via ref or callback */}
      <div style={{ display: 'none' }} data-save-quote={saveQuote} />
    </>
  );
});

// Export the save function for external use
export function saveToQuoteHistory(quoteData, calculations, settings, status = 'UNFINALIZED') {
  try {
    const now = new Date().toISOString();
    
    // Build calculation snapshot from calculations object
    const calculationSnapshot = {
      calculated_at: now,
      line_items: (calculations?.lineItems || []).map((item, idx) => ({
        id: `li_${idx}`,
        label: item.description || '',
        type: item.isSection ? 'SECTION' : 'DECISION',
        category: item.category || 'OTHER',
        quantity: item.quantity || 1,
        rate: item.unitPrice || item.amount || 0,
        total: item.amount || 0
      })),
      bases: {
        labor_base_amount: calculations?.laborBase || 0,
        labor_raw_amount: calculations?.laborRaw || 0
      },
      derived: {
        overhead_percent: settings?.overhead_percent || 0,
        profit_margin_percent: settings?.profit_margin_percent || 0,
        effective_percent: (settings?.overhead_percent || 0) + (settings?.profit_margin_percent || 0),
        overhead_margin_amount: (calculations?.overhead || 0) + (calculations?.profitMargin || 0)
      },
      totals: {
        subtotal: calculations?.subtotal || 0,
        tax_amount: calculations?.tax || 0,
        final_decision: calculations?.total || 0
      }
    };
    
    // Build settings snapshot
    const settingsSnapshot = {
      show_overhead_margin_line: settings?.show_service_fee_on_invoice !== false,
      overhead_percent: settings?.overhead_percent || 0,
      profit_margin_percent: settings?.profit_margin_percent || 0,
      tax_percent: settings?.tax_rate_percent || 0,
      currency: 'USD'
    };
    
    const newQuote = {
      id: Date.now().toString(),
      created_at: now,
      updated_at: now,
      status: status,
      client: {
        name: quoteData.client_name || 'Unnamed Client',
        project_title: quoteData.project_title || 'Untitled Project'
      },
      formData: quoteData,
      settings_snapshot: settingsSnapshot,
      calculation_snapshot: calculationSnapshot,
      // Legacy fields for backward compatibility
      client_name: quoteData.client_name || 'Unnamed Client',
      project_title: quoteData.project_title || 'Untitled Project',
      total: calculations?.total || 0,
      timestamp: now
    };
    
    // If finalizing, add finalized_at and lock
    if (status === 'FINAL') {
      newQuote.finalized_at = now;
    }

    const existing = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    const updated = [newQuote, ...existing].slice(0, 20);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    
    return newQuote;
  } catch (error) {
    console.error('Error saving to quote history:', error);
    return null;
  }
}

export default QuoteHistory;
