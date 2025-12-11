import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { 
  ArrowRight as ArrowRightIcon, 
  ArrowLeft as ArrowLeftIcon, 
  Check as CheckIcon, 
  Sparkles as SparklesIcon, 
  Zap as ZapIcon, 
  Target as TargetIcon, 
  X as XIcon 
} from "lucide-react";

export default function OnboardingWizard({ open, onClose, onComplete }) {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    companyName: '',
    skipOnboarding: false
  });

  const totalSteps = 3;

  const handleNext = () => {
    if (step < totalSteps) {
      setStep(step + 1);
    } else {
      handleComplete();
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const handleSkip = () => {
    localStorage.setItem('onboarding_completed', 'true');
    localStorage.setItem('onboarding_skipped', 'true');
    onClose();
  };

  const handleComplete = () => {
    // Save company name if provided
    if (formData.companyName.trim()) {
      const settings = JSON.parse(localStorage.getItem('nvision_settings') || '{}');
      settings.company_name = formData.companyName;
      localStorage.setItem('nvision_settings', JSON.stringify(settings));
    }

    // Mark onboarding as completed
    localStorage.setItem('onboarding_completed', 'true');
    
    if (onComplete) {
      onComplete(formData);
    }
    
    onClose();
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full mb-4" style={{ background: 'rgba(212, 175, 55, 0.1)' }}>
                <SparklesIcon className="w-10 h-10" style={{ color: 'var(--color-accent-primary)' }} />
              </div>
              <h2 className="text-3xl font-bold mb-3" style={{ color: 'var(--color-text-primary)' }}>
                Welcome to HelpMeFilm! 🎬
              </h2>
              <p className="text-lg mb-4" style={{ color: 'var(--color-text-secondary)' }}>
                The pricing calculator that helped me hit <span className="font-bold" style={{ color: 'var(--color-accent-primary)' }}>$100K without burning out</span>.
              </p>
            </div>

            <Card className="p-6" style={{ background: 'rgba(212, 175, 55, 0.05)', borderColor: 'var(--color-accent-primary)' }}>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <CheckIcon className="w-5 h-5 mt-0.5 flex-shrink-0" style={{ color: 'var(--color-success)' }} />
                  <div>
                    <div className="font-semibold" style={{ color: 'var(--color-text-primary)' }}>Stop Undercharging</div>
                    <div className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>Calculate fair rates based on your experience and market</div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckIcon className="w-5 h-5 mt-0.5 flex-shrink-0" style={{ color: 'var(--color-success)' }} />
                  <div>
                    <div className="font-semibold" style={{ color: 'var(--color-text-primary)' }}>Professional Quotes</div>
                    <div className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>Generate PDF quotes with signature fields in seconds</div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckIcon className="w-5 h-5 mt-0.5 flex-shrink-0" style={{ color: 'var(--color-success)' }} />
                  <div>
                    <div className="font-semibold" style={{ color: 'var(--color-text-primary)' }}>Save Time</div>
                    <div className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>Templates, keyboard shortcuts, and smart defaults</div>
                  </div>
                </div>
              </div>
            </Card>

            <p className="text-sm text-center" style={{ color: 'var(--color-text-muted)' }}>
              This quick setup takes less than 60 seconds
            </p>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full mb-4" style={{ background: 'rgba(212, 175, 55, 0.1)' }}>
                <ZapIcon className="w-10 h-10" style={{ color: 'var(--color-accent-primary)' }} />
              </div>
              <h2 className="text-2xl font-bold mb-3" style={{ color: 'var(--color-text-primary)' }}>
                Quick Setup
              </h2>
              <p className="text-base" style={{ color: 'var(--color-text-secondary)' }}>
                Let's personalize your calculator
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <Label htmlFor="companyName" style={{ color: 'var(--color-text-secondary)' }}>
                  Company Name (Optional)
                </Label>
                <Input
                  id="companyName"
                  value={formData.companyName}
                  onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                  placeholder="Your Company Name"
                  className="mt-2"
                  style={{ background: 'var(--color-input-bg)', borderColor: 'var(--color-input-border)', color: 'var(--color-text-primary)' }}
                />
                <p className="text-xs mt-1" style={{ color: 'var(--color-text-muted)' }}>
                  This will appear on your quotes and invoices
                </p>
              </div>

              <Card className="p-4" style={{ background: 'rgba(139, 92, 246, 0.05)', borderColor: 'var(--color-border)' }}>
                <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                  💡 <strong>Pro Tip:</strong> You can customize your logo, rates, and terms anytime in the Admin settings
                </p>
              </Card>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full mb-4" style={{ background: 'rgba(212, 175, 55, 0.1)' }}>
                <TargetIcon className="w-10 h-10" style={{ color: 'var(--color-accent-primary)' }} />
              </div>
              <h2 className="text-2xl font-bold mb-3" style={{ color: 'var(--color-text-primary)' }}>
                You're All Set! 🎉
              </h2>
              <p className="text-base" style={{ color: 'var(--color-text-secondary)' }}>
                Here's how to get started
              </p>
            </div>

            <div className="space-y-4">
              <Card className="p-4" style={{ background: 'var(--color-bg-tertiary)', borderColor: 'var(--color-border)' }}>
                <div className="flex items-start gap-3">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full flex-shrink-0" style={{ background: 'var(--color-accent-primary)', color: '#000' }}>
                    <span className="font-bold">1</span>
                  </div>
                  <div>
                    <div className="font-semibold mb-1" style={{ color: 'var(--color-text-primary)' }}>Select a Template</div>
                    <div className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>Choose from Wedding, Corporate, Music Video, or start from scratch</div>
                  </div>
                </div>
              </Card>

              <Card className="p-4" style={{ background: 'var(--color-bg-tertiary)', borderColor: 'var(--color-border)' }}>
                <div className="flex items-start gap-3">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full flex-shrink-0" style={{ background: 'var(--color-accent-primary)', color: '#000' }}>
                    <span className="font-bold">2</span>
                  </div>
                  <div>
                    <div className="font-semibold mb-1" style={{ color: 'var(--color-text-primary)' }}>Fill in Project Details</div>
                    <div className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>Add crew, gear, hours, and experience level</div>
                  </div>
                </div>
              </Card>

              <Card className="p-4" style={{ background: 'var(--color-bg-tertiary)', borderColor: 'var(--color-border)' }}>
                <div className="flex items-start gap-3">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full flex-shrink-0" style={{ background: 'var(--color-accent-primary)', color: '#000' }}>
                    <span className="font-bold">3</span>
                  </div>
                  <div>
                    <div className="font-semibold mb-1" style={{ color: 'var(--color-text-primary)' }}>Export Your Quote</div>
                    <div className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>Click "Export Quote" or "Export Invoice" to generate a professional PDF</div>
                  </div>
                </div>
              </Card>
            </div>

            <Card className="p-4" style={{ background: 'rgba(212, 175, 55, 0.05)', borderColor: 'var(--color-accent-primary)' }}>
              <p className="text-sm font-semibold mb-2" style={{ color: 'var(--color-text-primary)' }}>
                ⌨️ Keyboard Shortcuts:
              </p>
              <div className="grid grid-cols-2 gap-2 text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                <div><kbd className="px-2 py-1 rounded" style={{ background: 'var(--color-bg-tertiary)' }}>Ctrl+S</kbd> Save</div>
                <div><kbd className="px-2 py-1 rounded" style={{ background: 'var(--color-bg-tertiary)' }}>Ctrl+E</kbd> Export</div>
                <div><kbd className="px-2 py-1 rounded" style={{ background: 'var(--color-bg-tertiary)' }}>Ctrl+R</kbd> Round</div>
                <div><kbd className="px-2 py-1 rounded" style={{ background: 'var(--color-bg-tertiary)' }}>Ctrl+N</kbd> New</div>
              </div>
            </Card>
          </div>
        );

      default:
        return null;
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0, 0, 0, 0.8)' }}>
      <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-lg" style={{ background: 'var(--color-bg-secondary)', border: '1px solid var(--color-border)' }}>
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold" style={{ color: 'var(--color-text-primary)' }}>
              Getting Started
            </h2>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSkip}
                style={{ color: 'var(--color-text-muted)' }}
              >
                Skip
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                style={{ color: 'var(--color-text-muted)' }}
              >
                <XIcon className="w-4 h-4" />
              </Button>
            </div>
          </div>
          
          <div className="flex gap-2 mb-6">
            {[...Array(totalSteps)].map((_, i) => (
              <div
                key={i}
                className="h-1 flex-1 rounded-full transition-all"
                style={{
                  background: i < step ? 'var(--color-accent-primary)' : 'var(--color-border)'
                }}
              />
            ))}
          </div>

          <div className="py-6">
            {renderStep()}
          </div>

          <div className="flex items-center justify-between pt-4 border-t" style={{ borderColor: 'var(--color-border)' }}>
            <Button
              variant="ghost"
              onClick={handleBack}
              disabled={step === 1}
              style={{ color: 'var(--color-text-secondary)' }}
            >
              <ArrowLeftIcon className="w-4 h-4 mr-2" />
              Back
            </Button>

            <div className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
              Step {step} of {totalSteps}
            </div>

            <Button
              onClick={handleNext}
              style={{ background: 'var(--color-accent-primary)', color: '#000' }}
            >
              {step === totalSteps ? (
                <>
                  <CheckIcon className="w-4 h-4 mr-2" />
                  Get Started
                </>
              ) : (
                <>
                  Next
                  <ArrowRightIcon className="w-4 h-4 ml-2" />
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
