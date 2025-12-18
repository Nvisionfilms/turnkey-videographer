import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight, Camera, CheckCircle2, Sparkles, Zap } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function ContentPlaybook() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen" style={{ background: "var(--color-bg-primary)" }}>
      <div className="max-w-6xl mx-auto px-6 py-12">
        <div className="text-center mb-12">
          <div
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full border"
            style={{
              background: "rgba(0,0,0,0.08)",
              borderColor: "var(--color-border)",
              color: "var(--color-text-secondary)",
            }}
          >
            <Sparkles className="w-4 h-4" style={{ color: "var(--color-accent-primary)" }} />
            <span className="text-sm font-semibold">How NVision Films Creates Content</span>
          </div>

          <h1 className="text-4xl md:text-6xl font-bold mt-6 leading-tight" style={{ color: "var(--color-text-primary)" }}>
            Content that gets attention
            <span style={{ color: "var(--color-accent-primary)" }}> and builds trust.</span>
          </h1>

          <p className="text-lg md:text-xl max-w-3xl mx-auto mt-4" style={{ color: "var(--color-text-secondary)" }}>
            NVision Films is a reality-style content company. We don’t create staged content or copy trends.
            We document real moments, real work, and real results in a way that naturally holds attention and builds credibility.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center mt-8">
            <Button
              onClick={() => navigate(createPageUrl("Calculator"))}
              className="px-8 py-6 text-lg font-semibold"
              style={{ background: "var(--color-accent-primary)", color: "var(--color-button-text)" }}
            >
              Build a Quote <ArrowRight className="w-5 h-5 ml-2" />
            </Button>

            <Button
              variant="outline"
              onClick={() => navigate(createPageUrl("DeliverableCalculator"))}
              className="px-8 py-6 text-lg font-semibold"
              style={{
                background: "var(--color-bg-secondary)",
                borderColor: "var(--color-border)",
                color: "var(--color-text-primary)",
              }}
            >
              Price Deliverables
            </Button>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6 mb-10">
          <Card className="border-2" style={{ background: "var(--color-bg-card)", borderColor: "var(--color-border)" }}>
            <CardHeader>
              <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: "rgba(0,0,0,0.08)" }}>
                <Zap className="w-6 h-6" style={{ color: "var(--color-accent-primary)" }} />
              </div>
              <CardTitle className="text-xl mt-3" style={{ color: "var(--color-text-primary)" }}>
                Our Goal
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p style={{ color: "var(--color-text-secondary)" }}>
                Help your audience see the value instead of being told about it.
              </p>
            </CardContent>
          </Card>

          <Card className="border-2" style={{ background: "var(--color-bg-card)", borderColor: "var(--color-border)" }}>
            <CardHeader>
              <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: "rgba(0,0,0,0.08)" }}>
                <Camera className="w-6 h-6" style={{ color: "var(--color-accent-primary)" }} />
              </div>
              <CardTitle className="text-xl mt-3" style={{ color: "var(--color-text-primary)" }}>
                What We Film
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p style={{ color: "var(--color-text-secondary)" }}>
                Real moments, real work, real results — documented in a way people want to watch.
              </p>
            </CardContent>
          </Card>

          <Card className="border-2" style={{ background: "var(--color-bg-card)", borderColor: "var(--color-border)" }}>
            <CardHeader>
              <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: "rgba(0,0,0,0.08)" }}>
                <CheckCircle2 className="w-6 h-6" style={{ color: "var(--color-accent-primary)" }} />
              </div>
              <CardTitle className="text-xl mt-3" style={{ color: "var(--color-text-primary)" }}>
                What You Get
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p style={{ color: "var(--color-text-secondary)" }}>
                Content that feels honest, looks professional, and builds confidence with decision makers.
              </p>
            </CardContent>
          </Card>
        </div>

        <Card className="border-2" style={{ background: "var(--color-bg-card)", borderColor: "var(--color-border)" }}>
          <CardHeader>
            <CardTitle className="text-2xl" style={{ color: "var(--color-text-primary)" }}>
              How Our Content Works
            </CardTitle>
            <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
              A clear structure viewers instinctively understand.
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div className="rounded-xl p-5 border" style={{ background: "var(--color-bg-secondary)", borderColor: "var(--color-border)" }}>
                <div className="text-xs font-semibold mb-2" style={{ color: "var(--color-text-muted)" }}>
                  1. ATTENTION FIRST
                </div>
                <div className="text-lg font-semibold" style={{ color: "var(--color-text-primary)" }}>
                  We start with a real situation.
                </div>
                <ul className="mt-3 space-y-2 text-sm" style={{ color: "var(--color-text-secondary)" }}>
                  <li>Something discovered on-site</li>
                  <li>A process in motion</li>
                  <li>A before state that raises a question</li>
                </ul>
                <div className="mt-4 text-sm font-medium" style={{ color: "var(--color-text-primary)" }}>
                  The goal is to stop the scroll within the first few seconds.
                </div>
              </div>

              <div className="rounded-xl p-5 border" style={{ background: "var(--color-bg-secondary)", borderColor: "var(--color-border)" }}>
                <div className="text-xs font-semibold mb-2" style={{ color: "var(--color-text-muted)" }}>
                  2. REAL PROCESS
                </div>
                <div className="text-lg font-semibold" style={{ color: "var(--color-text-primary)" }}>
                  We show what actually happens.
                </div>
                <ul className="mt-3 space-y-2 text-sm" style={{ color: "var(--color-text-secondary)" }}>
                  <li>The work being done</li>
                  <li>Decisions being made</li>
                  <li>Adjustments along the way</li>
                </ul>
                <div className="mt-4 text-sm" style={{ color: "var(--color-text-secondary)" }}>
                  This makes the content feel honest, relatable, and trustworthy.
                </div>
              </div>

              <div className="rounded-xl p-5 border" style={{ background: "var(--color-bg-secondary)", borderColor: "var(--color-border)" }}>
                <div className="text-xs font-semibold mb-2" style={{ color: "var(--color-text-muted)" }}>
                  3. CLEAR PROOF
                </div>
                <div className="text-lg font-semibold" style={{ color: "var(--color-text-primary)" }}>
                  We always show the outcome.
                </div>
                <ul className="mt-3 space-y-2 text-sm" style={{ color: "var(--color-text-secondary)" }}>
                  <li>Before and after</li>
                  <li>Problem to solution</li>
                  <li>Mess to resolution</li>
                </ul>
                <div className="mt-4 text-sm" style={{ color: "var(--color-text-secondary)" }}>
                  No exaggeration. Just visual proof.
                </div>
              </div>

              <div className="rounded-xl p-5 border" style={{ background: "var(--color-bg-secondary)", borderColor: "var(--color-border)" }}>
                <div className="text-xs font-semibold mb-2" style={{ color: "var(--color-text-muted)" }}>
                  4. NATURAL CALL-TO-ACTION
                </div>
                <div className="text-lg font-semibold" style={{ color: "var(--color-text-primary)" }}>
                  We guide toward understanding.
                </div>
                <ul className="mt-3 space-y-2 text-sm" style={{ color: "var(--color-text-secondary)" }}>
                  <li>Why this work matters</li>
                  <li>What gets missed without it</li>
                  <li>What consistency really looks like</li>
                </ul>
                <div className="mt-4 text-sm" style={{ color: "var(--color-text-secondary)" }}>
                  This builds confidence and trust with decision makers.
                </div>
              </div>
            </div>

            <div className="rounded-xl p-6 border" style={{ background: "var(--color-bg-primary)", borderColor: "var(--color-border)" }}>
              <div className="text-xl font-bold" style={{ color: "var(--color-text-primary)" }}>
                What Makes NVision Different
              </div>
              <div className="grid md:grid-cols-2 gap-3 mt-4 text-sm" style={{ color: "var(--color-text-secondary)" }}>
                <div className="flex items-start gap-2">
                  <span style={{ color: "var(--color-accent-primary)" }}>•</span>
                  <span>We document reality instead of staging content</span>
                </div>
                <div className="flex items-start gap-2">
                  <span style={{ color: "var(--color-accent-primary)" }}>•</span>
                  <span>We focus on storytelling, not just posting</span>
                </div>
                <div className="flex items-start gap-2">
                  <span style={{ color: "var(--color-accent-primary)" }}>•</span>
                  <span>We design content around attention and proof</span>
                </div>
                <div className="flex items-start gap-2">
                  <span style={{ color: "var(--color-accent-primary)" }}>•</span>
                  <span>We keep content professional, clear, and intentional</span>
                </div>
              </div>

              <div className="mt-6 text-sm" style={{ color: "var(--color-text-secondary)" }}>
                This approach works especially well for:
              </div>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2 mt-3 text-sm" style={{ color: "var(--color-text-primary)" }}>
                {["Service-based businesses", "Founders and operators", "Companies that rely on trust and long-term relationships"].map((t) => (
                  <div
                    key={t}
                    className="rounded-lg border px-3 py-2"
                    style={{ background: "rgba(0,0,0,0.06)", borderColor: "var(--color-border)" }}
                  >
                    {t}
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-xl p-6 border" style={{ background: "rgba(0,0,0,0.06)", borderColor: "var(--color-border)" }}>
              <div className="text-xl font-bold" style={{ color: "var(--color-text-primary)" }}>
                What to Expect Working With Us
              </div>
              <div className="grid md:grid-cols-2 gap-3 mt-4 text-sm" style={{ color: "var(--color-text-secondary)" }}>
                <div className="flex items-start gap-2">
                  <span style={{ color: "var(--color-accent-primary)" }}>•</span>
                  <span>A clear monthly content plan</span>
                </div>
                <div className="flex items-start gap-2">
                  <span style={{ color: "var(--color-accent-primary)" }}>•</span>
                  <span>Filming built around real work being done</span>
                </div>
                <div className="flex items-start gap-2">
                  <span style={{ color: "var(--color-accent-primary)" }}>•</span>
                  <span>Content that reflects how your business actually operates</span>
                </div>
                <div className="flex items-start gap-2">
                  <span style={{ color: "var(--color-accent-primary)" }}>•</span>
                  <span>Consistent visuals that support credibility and growth</span>
                </div>
              </div>

              <div className="mt-6 text-lg font-semibold" style={{ color: "var(--color-text-primary)" }}>
                We don’t just post content. We help your audience understand your value without you having to explain it.
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
