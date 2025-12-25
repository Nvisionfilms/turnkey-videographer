import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Zap, Heart, ArrowRight, Coffee, ChevronLeft, ChevronRight, DollarSign, FileText, Settings
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import LiveUpdatesTicker from "@/components/LiveUpdatesTicker";

export default function LandingPage() {
  const navigate = useNavigate();

  const handleLaunchCalculator = () => {
    localStorage.setItem('nvision_welcomed', 'true');
    navigate(createPageUrl("Calculator"));
  };

  return (
    <div className="min-h-screen" style={{ background: 'var(--color-bg-primary)' }}>
      <LiveUpdatesTicker />
      {/* Hero Section */}
      <HeroSection onLaunch={handleLaunchCalculator} />
      
      {/* The Real Problem */}
      <RealProblemSection />
      
      {/* Your Story */}
      <StorySection />
      
      {/* What This Actually Is */}
      <WhatThisIsSection onLaunch={handleLaunchCalculator} />
      
      {/* Simple CTA */}
      <SimpleCTASection onLaunch={handleLaunchCalculator} />
    </div>
  );
}

function HeroSection({ onLaunch }) {
  return (
    <section className="py-20 px-6">
      <div className="max-w-6xl mx-auto">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div>
            <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight" style={{ color: 'var(--color-text-primary)' }}>
              TurnKey Pricing Ledger
            </h1>
            
            <p className="text-lg md:text-xl mb-4 leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
              Pricing records for creative work.
            </p>
            
            <p className="text-lg md:text-xl mb-8 leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
              Not estimates. Not memory.
            </p>
            
            <p className="text-base mb-8 leading-relaxed" style={{ color: 'var(--color-text-muted)' }}>
              TurnKey records how prices are set, so they don't drift later.
            </p>
            
            <Button 
              onClick={onLaunch}
              size="lg"
              className="px-8 py-4 text-lg font-semibold hover:scale-105 transition-transform"
              style={{ background: 'var(--color-accent-primary)', color: 'var(--color-button-text)' }}
            >
              Start a record
            </Button>
          </div>
          
          <div>
            <CalculatorCarousel />
          </div>
        </div>
      </div>
    </section>
  );
}

function RealProblemSection() {
  return (
    <section className="py-16 px-6" style={{ background: 'var(--color-bg-card)' }}>
      <div className="max-w-3xl mx-auto">
        <h2 className="text-3xl md:text-4xl font-bold mb-8 leading-tight" style={{ color: 'var(--color-text-primary)' }}>
          What TurnKey Is
        </h2>
        
        <div className="space-y-4 text-lg leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
          <p>
            TurnKey is a pricing ledger for creative services.
          </p>
          
          <p>
            It captures:
          </p>
          
          <ul className="list-disc list-inside space-y-2 ml-4">
            <li>what was priced</li>
            <li>when it was priced</li>
            <li>under what conditions</li>
          </ul>
          
          <p className="pt-4">
            So pricing decisions remain consistent over time.
          </p>
          
          <p className="text-base pt-4" style={{ color: 'var(--color-text-muted)' }}>
            No motivation. No optimization tricks. Just records.
          </p>
        </div>
      </div>
    </section>
  );
}


function StorySection() {
  return (
    <section className="py-16 px-6">
      <div className="max-w-3xl mx-auto">
        <div className="mb-8">
          <h2 className="text-2xl md:text-3xl font-bold mb-6" style={{ color: 'var(--color-text-primary)' }}>
            What It Replaces
          </h2>
        </div>
        
        <div className="space-y-4 text-base md:text-lg leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
          <p>
            Spreadsheets.
          </p>
          
          <p>
            Gut checks.
          </p>
          
          <p>
            Re-explaining old prices.
          </p>
          
          <p>
            Re-negotiating forgotten decisions.
          </p>
          
          <p className="text-lg pt-4" style={{ color: 'var(--color-text-primary)' }}>
            TurnKey doesn't make pricing easier.
          </p>
          
          <p className="text-lg font-semibold" style={{ color: 'var(--color-text-primary)' }}>
            It makes pricing visible.
          </p>
        </div>
      </div>
    </section>
  );
}

function WhatThisIsSection({ onLaunch }) {
  return (
    <section className="py-16 px-6" style={{ background: 'var(--color-bg-card)' }}>
      <div className="max-w-3xl mx-auto">
        <h2 className="text-2xl md:text-3xl font-bold mb-8" style={{ color: 'var(--color-text-primary)' }}>
          How It Works
        </h2>
        
        <div className="space-y-6">
          <Card style={{ background: 'var(--color-bg-primary)', border: 'none' }}>
            <CardContent className="p-6">
              <p className="text-base md:text-lg leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
                Build a quote from defined components
              </p>
            </CardContent>
          </Card>
          
          <Card style={{ background: 'var(--color-bg-primary)', border: 'none' }}>
            <CardContent className="p-6">
              <p className="text-base md:text-lg leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
                Record trade-offs and scope decisions
              </p>
            </CardContent>
          </Card>
          
          <Card style={{ background: 'var(--color-bg-primary)', border: 'none' }}>
            <CardContent className="p-6">
              <p className="text-base md:text-lg leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
                Lock the record
              </p>
            </CardContent>
          </Card>
          
          <Card style={{ background: 'var(--color-bg-primary)', border: 'none' }}>
            <CardContent className="p-6">
              <p className="text-base md:text-lg leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
                Render a client-friendly quote or invoice
              </p>
            </CardContent>
          </Card>
        </div>
        
        <p className="text-base mt-8 leading-relaxed" style={{ color: 'var(--color-text-muted)' }}>
          The ledger stays intact. The document stays clear.
        </p>
        
        <div className="mt-10 text-center">
          <Button 
            onClick={onLaunch}
            size="lg"
            className="px-8 py-4 text-lg font-semibold"
            style={{ background: 'var(--color-accent-primary)', color: 'var(--color-button-text)' }}
          >
            View how it works <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
        </div>
      </div>
    </section>
  );
}

function SimpleCTASection({ onLaunch }) {
  return (
    <section className="py-20 px-6">
      <div className="max-w-3xl mx-auto text-center">
        <h2 className="text-3xl md:text-4xl font-bold mb-6 leading-tight" style={{ color: 'var(--color-text-primary)' }}>
          TurnKey exists so pricing decisions don't disappear.
        </h2>
        
        <p className="text-lg mb-8 leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
          Records pricing decisions so they can't be forgotten.
        </p>
        
        <Button 
          onClick={onLaunch}
          size="lg"
          className="px-10 py-6 text-xl font-semibold hover:scale-105 transition-transform"
          style={{ background: 'var(--color-accent-primary)', color: 'var(--color-button-text)' }}
        >
          Start a record
        </Button>
      </div>
    </section>
  );
}

function CalculatorCarousel() {
  const [currentSlide, setCurrentSlide] = useState(0);
  
  const slides = [
    {
      icon: DollarSign,
      title: "Set Your Rates",
      description: "Choose your experience level and the calculator suggests industry-standard day rates",
      color: "rgba(76, 111, 255, 0.12)"
    },
    {
      icon: Settings,
      title: "Select Your Gear",
      description: "Add cameras, lenses, audio equipment - the tool calculates amortization automatically",
      color: "rgba(76, 111, 255, 0.12)"
    },
    {
      icon: FileText,
      title: "Generate Quote",
      description: "Professional PDF quotes ready to send with all line items, taxes, and terms included",
      color: "rgba(76, 111, 255, 0.12)"
    }
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
  };

  return (
    <div className="relative">
      <Card className="shadow-2xl border-2" style={{ background: 'var(--color-bg-card)', borderColor: 'var(--color-accent-primary)' }}>
        <CardContent className="p-8 md:p-12">
          <div className="min-h-[280px] flex flex-col items-center justify-center text-center">
            <div 
              className="w-20 h-20 rounded-full flex items-center justify-center mb-6 transition-all duration-500"
              style={{ background: slides[currentSlide].color }}
            >
              {React.createElement(slides[currentSlide].icon, {
                className: "w-10 h-10",
                style: { color: 'var(--color-accent-primary)' }
              })}
            </div>
            
            <h3 className="text-2xl md:text-3xl font-bold mb-4 transition-all duration-500" style={{ color: 'var(--color-text-primary)' }}>
              {slides[currentSlide].title}
            </h3>
            
            <p className="text-base md:text-lg leading-relaxed transition-all duration-500" style={{ color: 'var(--color-text-secondary)' }}>
              {slides[currentSlide].description}
            </p>
          </div>
          
          {/* Navigation */}
          <div className="flex items-center justify-center gap-4 mt-8">
            <button
              onClick={prevSlide}
              className="p-2 rounded-full hover:scale-110 transition-transform"
              style={{ background: 'rgba(76, 111, 255, 0.12)' }}
            >
              <ChevronLeft className="w-5 h-5" style={{ color: 'var(--color-accent-primary)' }} />
            </button>
            
            <div className="flex gap-2">
              {slides.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentSlide(idx)}
                  className="w-2 h-2 rounded-full transition-all duration-300"
                  style={{
                    background: idx === currentSlide ? 'var(--color-accent-primary)' : 'rgba(76, 111, 255, 0.28)',
                    width: idx === currentSlide ? '24px' : '8px'
                  }}
                />
              ))}
            </div>
            
            <button
              onClick={nextSlide}
              className="p-2 rounded-full hover:scale-110 transition-transform"
              style={{ background: 'rgba(76, 111, 255, 0.12)' }}
            >
              <ChevronRight className="w-5 h-5" style={{ color: 'var(--color-accent-primary)' }} />
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
