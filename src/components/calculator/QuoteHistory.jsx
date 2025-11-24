import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { History, Trash2, FileText, DollarSign } from "lucide-react";
import { format } from "date-fns";

const STORAGE_KEY = 'quote_history';

export default function QuoteHistory({ onLoadQuote }) {
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

  const saveQuote = (quoteData, total) => {
    try {
      const newQuote = {
        id: Date.now().toString(),
        timestamp: new Date().toISOString(),
        client_name: quoteData.client_name || 'Unnamed Client',
        project_title: quoteData.project_title || 'Untitled Project',
        total: total,
        formData: quoteData
      };

      const existing = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
      const updated = [newQuote, ...existing].slice(0, 20); // Keep last 20
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      setQuotes(updated);
    } catch (error) {
      console.error('Error saving quote:', error);
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
}

// Export the save function for external use
export function saveToQuoteHistory(quoteData, total) {
  try {
    const newQuote = {
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
      client_name: quoteData.client_name || 'Unnamed Client',
      project_title: quoteData.project_title || 'Untitled Project',
      total: total,
      formData: quoteData
    };

    const existing = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    const updated = [newQuote, ...existing].slice(0, 20);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (error) {
    console.error('Error saving to quote history:', error);
  }
}
