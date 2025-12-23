import React from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

export default function Terms() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen p-6" style={{ background: 'var(--color-bg-primary)' }}>
      <div className="max-w-2xl mx-auto">
        <Button
          variant="ghost"
          onClick={() => navigate(-1)}
          className="mb-8"
          style={{ color: 'var(--color-text-secondary)' }}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>

        <h1 className="text-3xl font-bold mb-8" style={{ color: 'var(--color-text-primary)' }}>
          Terms of Use
        </h1>

        <div className="space-y-8 text-lg" style={{ color: 'var(--color-text-secondary)' }}>
          <section>
            <h2 className="text-xl font-semibold mb-3" style={{ color: 'var(--color-text-primary)' }}>
              What This Is
            </h2>
            <p>
              TurnKey is pricing infrastructure. It calculates costs, records decisions, and surfaces patterns over time.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3" style={{ color: 'var(--color-text-primary)' }}>
              What This Is Not
            </h2>
            <p>
              TurnKey does not provide financial advice, legal advice, or guarantees of any outcome. 
              The system reflects your decisions. It does not make them for you.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3" style={{ color: 'var(--color-text-primary)' }}>
              Your Responsibility
            </h2>
            <p>
              You are responsible for your pricing decisions. The calculations provided are based on 
              the data you enter. Results depend on the accuracy of your inputs.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3" style={{ color: 'var(--color-text-primary)' }}>
              Data Storage
            </h2>
            <p>
              All data is stored locally in your browser. We do not have access to your quotes, 
              rates, or behavioral history. Clearing your browser data will erase your history.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3" style={{ color: 'var(--color-text-primary)' }}>
              Subscriptions
            </h2>
            <p>
              Subscriptions can be canceled at any time. Access remains active through the end of 
              the billing period. No partial refunds are provided.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3" style={{ color: 'var(--color-text-primary)' }}>
              Founding Operator
            </h2>
            <p>
              Founding Operator is limited to 98 spots. If the cap is exceeded, purchases beyond 
              the limit are refunded in full.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3" style={{ color: 'var(--color-text-primary)' }}>
              No Guarantees
            </h2>
            <p>
              We make no guarantees about income, revenue, or business outcomes. TurnKey provides 
              visibility into your pricing behavior. What you do with that visibility is yours.
            </p>
          </section>

          <p className="text-sm pt-8" style={{ color: 'var(--color-text-muted)' }}>
            Last updated: December 2024
          </p>
        </div>
      </div>
    </div>
  );
}
