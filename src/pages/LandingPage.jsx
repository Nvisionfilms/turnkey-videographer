import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Zap, Heart, ArrowRight, Coffee, ChevronLeft, ChevronRight, DollarSign, FileText, Settings
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function LandingPage() {
  const navigate = useNavigate();

  const handleLaunchCalculator = () => {
    localStorage.setItem('nvision_welcomed', 'true');
    navigate(createPageUrl("Calculator"));
  };

  return (
    <div className="min-h-screen" style={{ background: 'var(--color-bg-primary)' }}>
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
              You already have the talent —
              <span style={{ color: 'var(--color-accent-primary)' }}> now get the clarity to match.</span>
            </h1>
            
            <p className="text-lg md:text-xl mb-8 leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
              Charge what you're worth. Send quotes with confidence. Run your creative business like a pro.
            </p>
            
            <Button 
              onClick={onLaunch}
              size="lg"
              className="px-8 py-4 text-lg font-semibold hover:scale-105 transition-transform"
              style={{ background: 'var(--color-accent-primary)', color: 'var(--color-button-text)' }}
            >
              Launch the Calculator
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
          The struggle isn't your talent.
        </h2>
        
        <div className="space-y-4 text-lg leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
          <p>
            It's the <span className="font-semibold" style={{ color: 'var(--color-text-primary)' }}>anxiety before you hit send</span> on a quote.
          </p>
          
          <p>
            It's wondering if you're <span className="font-semibold" style={{ color: 'var(--color-text-primary)' }}>charging too much</span> or <span className="font-semibold" style={{ color: 'var(--color-text-primary)' }}>leaving money on the table</span>.
          </p>
          
          <p>
            It's being <span className="font-semibold" style={{ color: 'var(--color-text-primary)' }}>busy but not profitable</span>.
          </p>
          
          <p className="text-xl font-bold pt-6" style={{ color: 'var(--color-accent-primary)' }}>
            Confidence doesn't come from talent — it comes from clarity.
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
          <Coffee className="w-10 h-10 mb-4" style={{ color: 'var(--color-accent-primary)' }} />
          <h2 className="text-2xl md:text-3xl font-bold mb-6" style={{ color: 'var(--color-text-primary)' }}>
            Here's the truth:
          </h2>
        </div>
        
        <div className="space-y-4 text-base md:text-lg leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
          <p>
            I hit <span className="font-bold" style={{ color: 'var(--color-accent-primary)' }}>100K without burning out</span>.
          </p>
          
          <p>
            Not because I worked harder. Not because I got lucky.
          </p>
          
          <p className="text-lg font-semibold" style={{ color: 'var(--color-text-primary)' }}>
            Because I finally valued my time.
          </p>
          
          <p>
            I built this calculator because I was tired of watching talented creatives undercharge, overwork, and wonder why they're exhausted.
          </p>
          
          <p>
            This isn't a course. It's not a masterclass. It's not going to teach you cinematography.
          </p>
          
          <p className="text-lg font-semibold pt-3" style={{ color: 'var(--color-text-primary)' }}>
            It's just a tool that gives you a number you can trust.
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
          What this actually is:
        </h2>
        
        <div className="space-y-6">
          <Card style={{ background: 'var(--color-bg-primary)', border: 'none' }}>
            <CardContent className="p-6">
              <p className="text-base md:text-lg leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
                A calculator that factors in your <span className="font-semibold" style={{ color: 'var(--color-text-primary)' }}>gear</span>, your <span className="font-semibold" style={{ color: 'var(--color-text-primary)' }}>experience</span>, and your <span className="font-semibold" style={{ color: 'var(--color-text-primary)' }}>time</span> to give you a baseline number.
              </p>
            </CardContent>
          </Card>
          
          <Card style={{ background: 'var(--color-bg-primary)', border: 'none' }}>
            <CardContent className="p-6">
              <p className="text-base md:text-lg leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
                It generates a <span className="font-semibold" style={{ color: 'var(--color-text-primary)' }}>professional quote</span> you can send to clients without second-guessing yourself.
              </p>
            </CardContent>
          </Card>
          
          <Card style={{ background: 'var(--color-bg-primary)', border: 'none' }}>
            <CardContent className="p-6">
              <p className="text-base md:text-lg leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
                It helps you <span className="font-semibold" style={{ color: 'var(--color-text-primary)' }}>stop undercharging</span> and start building a sustainable creative business.
              </p>
            </CardContent>
          </Card>
        </div>
        
        <div className="mt-10 text-center">
          <Button 
            onClick={onLaunch}
            size="lg"
            className="px-8 py-4 text-lg font-semibold"
            style={{ background: 'var(--color-accent-primary)', color: 'var(--color-button-text)' }}
          >
            Try it now <ArrowRight className="w-5 h-5 ml-2" />
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
        <Heart className="w-12 h-12 mx-auto mb-6" style={{ color: 'var(--color-accent-primary)' }} />
        
        <h2 className="text-3xl md:text-4xl font-bold mb-6 leading-tight" style={{ color: 'var(--color-text-primary)' }}>
          You deserve to be paid what you're worth.
        </h2>
        
        <p className="text-lg mb-8 leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
          This tool just makes it easier to figure out what that is.
        </p>
        
        <Button 
          onClick={onLaunch}
          size="lg"
          className="px-10 py-6 text-xl font-semibold hover:scale-105 transition-transform"
          style={{ background: 'var(--color-accent-primary)', color: 'var(--color-button-text)' }}
        >
          Launch Calculator
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
      color: "rgba(212, 175, 55, 0.1)"
    },
    {
      icon: Settings,
      title: "Select Your Gear",
      description: "Add cameras, lenses, audio equipment - the tool calculates amortization automatically",
      color: "rgba(212, 175, 55, 0.1)"
    },
    {
      icon: FileText,
      title: "Generate Quote",
      description: "Professional PDF quotes ready to send with all line items, taxes, and terms included",
      color: "rgba(212, 175, 55, 0.1)"
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
              style={{ background: 'rgba(212, 175, 55, 0.1)' }}
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
                    background: idx === currentSlide ? 'var(--color-accent-primary)' : 'rgba(212, 175, 55, 0.3)',
                    width: idx === currentSlide ? '24px' : '8px'
                  }}
                />
              ))}
            </div>
            
            <button
              onClick={nextSlide}
              className="p-2 rounded-full hover:scale-110 transition-transform"
              style={{ background: 'rgba(212, 175, 55, 0.1)' }}
            >
              <ChevronRight className="w-5 h-5" style={{ color: 'var(--color-accent-primary)' }} />
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
