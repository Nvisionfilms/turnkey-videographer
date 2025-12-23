import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

export default function Privacy() {
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
          Privacy
        </h1>

        <div className="space-y-8 text-lg" style={{ color: 'var(--color-text-secondary)' }}>
          <section>
            <h2 className="text-xl font-semibold mb-3" style={{ color: 'var(--color-text-primary)' }}>
              Local Storage Only
            </h2>
            <p>
              Your quotes, rates, settings, and behavioral history are stored locally in your browser. 
              We do not transmit, collect, or have access to this data.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3" style={{ color: 'var(--color-text-primary)' }}>
              What We Collect
            </h2>
            <p>
              When you purchase a subscription, Stripe processes your payment. We receive confirmation 
              of payment but do not store your payment details.
            </p>
            <p className="mt-3">
              We may collect your email address if you provide it during checkout or code activation. 
              This is used only for subscription management and support.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3" style={{ color: 'var(--color-text-primary)' }}>
              No Tracking
            </h2>
            <p>
              We do not use analytics that track your behavior within the application. 
              Your pricing decisions remain private.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3" style={{ color: 'var(--color-text-primary)' }}>
              Data Deletion
            </h2>
            <p>
              Clearing your browser's local storage will permanently delete all your data. 
              We cannot recover it because we never had it.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3" style={{ color: 'var(--color-text-primary)' }}>
              Contact
            </h2>
            <p>
              Questions: contact@nvisionfilms.com
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
