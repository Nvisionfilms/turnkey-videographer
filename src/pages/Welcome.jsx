
import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, Zap, DollarSign, FileText, Settings, Clock } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function Welcome() {
  const navigate = useNavigate();

  const handleGetStarted = () => {
    localStorage.setItem('nvision_welcomed', 'true');
    navigate(createPageUrl("Calculator"));
  };

  const features = [
    {
      icon: <Zap className="w-6 h-6" />,
      title: "Live Quote Builder",
      description: "Half-day, full-day, or custom-hour shoots with instant calculations"
    },
    {
      icon: <DollarSign className="w-6 h-6" />,
      title: "Role-Based Pricing",
      description: "Director, DP, Editor, Audio, and more with industry-standard rates"
    },
    {
      icon: <Settings className="w-6 h-6" />,
      title: "Gear Amortization",
      description: "Accurate equipment value tracking across job-days"
    },
    {
      icon: <FileText className="w-6 h-6" />,
      title: "Smart Adjustments",
      description: "Region and industry multipliers for local market pricing"
    },
    {
      icon: <Check className="w-6 h-6" />,
      title: "Auto Calculations",
      description: "Tax, deposit, discounts, and rush fees computed automatically"
    },
    {
      icon: <Clock className="w-6 h-6" />,
      title: "Export Ready",
      description: "PDF or email export for client-ready professional quotes"
    }
  ];

  return (
    <div className="min-h-screen" style={{ background: 'var(--color-bg-primary)' }}>
      <div className="max-w-6xl mx-auto px-6 py-12">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl mb-6 shadow-xl" style={{ background: 'var(--color-accent-primary)' }}>
            <Zap className="w-10 h-10" style={{ color: 'var(--color-button-text)' }} />
          </div>
          <h1 className="text-5xl font-bold mb-4" style={{ color: 'var(--color-text-primary)' }}>
            Instant Quotes. Industry Precision.<br />
            <span style={{ color: 'var(--color-accent-primary)' }}>NVision Standard.</span>
          </h1>
          <p className="text-xl max-w-3xl mx-auto mb-8" style={{ color: 'var(--color-text-secondary)' }}>
            The NVision Turn-Key Videographer Calculator is a professional-grade quoting system built for filmmakers, production teams, and agencies who need fast, transparent, and accurate pricing.
          </p>
          <div className="flex gap-4 justify-center">
            <Button 
              onClick={handleGetStarted}
              className="px-8 py-6 text-lg font-semibold"
              style={{ background: 'var(--color-accent-primary)', color: 'var(--color-button-text)' }}
            >
              Try Free (1 Quote)
            </Button>
          </div>
          <p className="mt-4 text-sm" style={{ color: 'var(--color-text-muted)' }}>
            One free quote to test the system. Unlock unlimited access with one-time payment.
          </p>
        </div>

        {/* Features Grid */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-center mb-12" style={{ color: 'var(--color-text-primary)' }}>
            💡 Features
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <Card key={index} className="border-0 shadow-lg" style={{ background: 'var(--color-bg-card)', borderColor: 'var(--color-border)' }}>
                <CardHeader>
                  <div className="w-12 h-12 rounded-lg flex items-center justify-center mb-4" style={{ background: 'rgba(212, 175, 55, 0.1)', color: 'var(--color-accent-primary)' }}>
                    {feature.icon}
                  </div>
                  <CardTitle className="text-lg" style={{ color: 'var(--color-text-primary)' }}>{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p style={{ color: 'var(--color-text-secondary)' }}>{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Built for Creators */}
        <Card className="border-0 shadow-2xl mb-12" style={{ background: 'var(--color-bg-card)', borderColor: 'var(--color-border)' }}>
          <CardContent className="p-12">
            <h2 className="text-3xl font-bold mb-6" style={{ color: 'var(--color-text-primary)' }}>
              🧾 Built for Creators
            </h2>
            <p className="text-lg mb-6" style={{ color: 'var(--color-text-secondary)' }}>
              Turn your craft into a scalable business tool. The NVision calculator helps you price with confidence, protect your time, and present professional estimates that clients respect.
            </p>
            <p className="text-xl font-semibold" style={{ color: 'var(--color-accent-primary)' }}>
              Plan smarter. Quote faster. Get paid what you're worth.
            </p>
          </CardContent>
        </Card>

        {/* CTA */}
        <div className="text-center">
          <Button 
            onClick={handleGetStarted}
            size="lg"
            className="px-12 py-6 text-xl font-semibold"
            style={{ background: 'var(--color-accent-primary)', color: 'var(--color-button-text)' }}
          >
            Start Your Free Quote
          </Button>
        </div>
      </div>
    </div>
  );
}
