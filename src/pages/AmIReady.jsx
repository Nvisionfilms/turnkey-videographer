import React from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

export default function AmIReady() {
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

        <h1 className="text-3xl font-bold mb-12" style={{ color: 'var(--color-text-primary)' }}>
          Am I Ready?
        </h1>

        <div className="space-y-12">
          <section>
            <p className="text-xl mb-8" style={{ color: 'var(--color-text-secondary)' }}>
              This is not a quiz. These are statements. Read them and notice your reaction.
            </p>
          </section>

          <section className="space-y-6">
            <div className="p-6 rounded-lg" style={{ background: 'var(--color-bg-secondary)', border: '1px solid var(--color-border)' }}>
              <p className="text-lg" style={{ color: 'var(--color-text-primary)' }}>
                If you've never hired crew, you don't need this yet.
              </p>
            </div>

            <div className="p-6 rounded-lg" style={{ background: 'var(--color-bg-secondary)', border: '1px solid var(--color-border)' }}>
              <p className="text-lg" style={{ color: 'var(--color-text-primary)' }}>
                If you've never discounted out of fear, this will feel uncomfortable.
              </p>
            </div>

            <div className="p-6 rounded-lg" style={{ background: 'var(--color-bg-secondary)', border: '1px solid var(--color-border)' }}>
              <p className="text-lg" style={{ color: 'var(--color-text-primary)' }}>
                If your quotes don't scare you a little, you're not the user.
              </p>
            </div>

            <div className="p-6 rounded-lg" style={{ background: 'var(--color-bg-secondary)', border: '1px solid var(--color-border)' }}>
              <p className="text-lg" style={{ color: 'var(--color-text-primary)' }}>
                If you've never sent a quote and immediately regretted the number, keep waiting.
              </p>
            </div>

            <div className="p-6 rounded-lg" style={{ background: 'var(--color-bg-secondary)', border: '1px solid var(--color-border)' }}>
              <p className="text-lg" style={{ color: 'var(--color-text-primary)' }}>
                If you're looking for someone to tell you what to charge, this isn't it.
              </p>
            </div>

            <div className="p-6 rounded-lg" style={{ background: 'var(--color-bg-secondary)', border: '1px solid var(--color-border)' }}>
              <p className="text-lg" style={{ color: 'var(--color-text-primary)' }}>
                If you want reassurance, you'll find the opposite here.
              </p>
            </div>
          </section>

          <section className="pt-8">
            <p className="text-lg mb-4" style={{ color: 'var(--color-text-muted)' }}>
              Still here?
            </p>
            <p className="text-xl mb-8" style={{ color: 'var(--color-text-secondary)' }}>
              TurnKey is for people who are ready to see what they've actually been doing.
            </p>
            <Button
              onClick={() => navigate(createPageUrl("Calculator"))}
              className="px-8 py-4 text-lg"
              style={{ background: 'var(--color-accent-primary)', color: 'var(--color-button-text)' }}
            >
              See Your First Quote
            </Button>
          </section>
        </div>
      </div>
    </div>
  );
}
