import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChevronDown, ChevronUp } from "lucide-react";

export default function CollapsibleSection({ 
  title, 
  children, 
  defaultOpen = true,
  icon: Icon,
  badge,
  cardClassName = "",
  cardHeaderClassName = "",
  cardTitleClassName = ""
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <Card className={`shadow-md ${cardClassName}`}>
      <CardHeader 
        className={`cursor-pointer ${cardHeaderClassName}`}
        onClick={() => setIsOpen(!isOpen)}
        style={{ 
          background: 'var(--color-bg-tertiary)', 
          borderBottom: isOpen ? '1px solid var(--color-border-dark)' : 'none'
        }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {Icon && <Icon className="w-5 h-5" style={{ color: 'var(--color-accent-primary)' }} />}
            <CardTitle className={cardTitleClassName} style={{ color: 'var(--color-text-primary)' }}>
              {title}
            </CardTitle>
            {badge && (
              <span className="text-xs px-2 py-0.5 rounded" style={{ 
                background: 'rgba(212, 175, 55, 0.2)', 
                color: 'var(--color-accent-primary)' 
              }}>
                {badge}
              </span>
            )}
          </div>
          {isOpen ? (
            <ChevronUp className="w-5 h-5" style={{ color: 'var(--color-text-secondary)' }} />
          ) : (
            <ChevronDown className="w-5 h-5" style={{ color: 'var(--color-text-secondary)' }} />
          )}
        </div>
      </CardHeader>
      {isOpen && (
        <CardContent className="p-6">
          {children}
        </CardContent>
      )}
    </Card>
  );
}
