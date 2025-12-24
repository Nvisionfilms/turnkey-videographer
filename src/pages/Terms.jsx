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

        <h1 className="text-2xl font-semibold mb-2" style={{ color: 'var(--color-text-primary)' }}>
          TurnKey Pricing Ledger
        </h1>
        <h2 className="text-lg mb-8" style={{ color: 'var(--color-text-muted)' }}>
          Terms of Service
        </h2>

        <p className="text-xs mb-8" style={{ color: 'var(--color-text-muted)' }}>
          Effective Date: December 24, 2024
        </p>

        <div className="space-y-8 text-sm leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
          
          <p>
            These Terms of Service ("Terms") govern access to and use of the TurnKey Pricing Ledger platform ("TurnKey," "Service," "Platform"). By creating an account, accessing, or using TurnKey, you agree to be bound by these Terms.
          </p>
          <p className="font-medium" style={{ color: 'var(--color-text-primary)' }}>
            If you do not agree, do not use the Service.
          </p>

          {/* 1. SERVICE DESCRIPTION */}
          <section>
            <h3 className="text-base font-semibold mb-3" style={{ color: 'var(--color-text-primary)' }}>
              1. Service Description
            </h3>
            <p className="mb-3">
              TurnKey is a pricing ledger system designed to record pricing decisions and related user-entered data.
            </p>
            <p className="mb-2">TurnKey:</p>
            <ul className="list-disc list-inside space-y-1 ml-2 mb-3">
              <li>records user inputs</li>
              <li>preserves historical pricing records</li>
              <li>does not suggest, recommend, or determine prices</li>
              <li>does not interpret outcomes</li>
            </ul>
            <p>
              TurnKey does not provide business advice, sales advice, financial advice, or pricing recommendations.
            </p>
          </section>

          {/* 2. ELIGIBILITY */}
          <section>
            <h3 className="text-base font-semibold mb-3" style={{ color: 'var(--color-text-primary)' }}>
              2. Eligibility
            </h3>
            <p className="mb-3">
              You must be at least 18 years old and legally capable of entering into binding contracts to use TurnKey.
            </p>
            <p>You represent that:</p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>you are using TurnKey for professional or business purposes</li>
              <li>you are responsible for all decisions entered into the system</li>
            </ul>
          </section>

          {/* 3. SUBSCRIPTION TERMS */}
          <section>
            <h3 className="text-base font-semibold mb-3" style={{ color: 'var(--color-text-primary)' }}>
              3. Subscription Terms
            </h3>
            <h4 className="text-sm font-medium mb-2" style={{ color: 'var(--color-text-primary)' }}>
              3.1 Annual Subscription
            </h4>
            <p className="mb-3">
              TurnKey is offered as a subscription, billed in advance (monthly or annually).
            </p>
            <p>
              Pricing behavior and patterns require longitudinal records and cannot be meaningfully observed or evaluated on a short-term basis.
            </p>
          </section>

          {/* 4. EVALUATION PERIOD & REFUNDS */}
          <section>
            <h3 className="text-base font-semibold mb-3" style={{ color: 'var(--color-text-primary)' }}>
              4. Evaluation Period & Refunds
            </h3>
            
            <h4 className="text-sm font-medium mb-2" style={{ color: 'var(--color-text-primary)' }}>
              4.1 Evaluation Period
            </h4>
            <p className="mb-4">
              New subscribers may request a full refund during the first 14 days following the subscription start date ("Evaluation Period").
            </p>
            
            <h4 className="text-sm font-medium mb-2" style={{ color: 'var(--color-text-primary)' }}>
              4.2 Refund Eligibility Conditions
            </h4>
            <p className="mb-2">
              A refund request will be honored only if all of the following conditions are met:
            </p>
            <ul className="list-disc list-inside space-y-1 ml-2 mb-3">
              <li>The account has recorded a minimum of 3 pricing decisions during the Evaluation Period</li>
              <li>The refund request is submitted in writing before the Evaluation Period expires</li>
            </ul>
            <p className="mb-4">
              Refund eligibility is based solely on recorded system usage, not on outcomes, sales performance, or perceived effectiveness.
            </p>
            
            <h4 className="text-sm font-medium mb-2" style={{ color: 'var(--color-text-primary)' }}>
              4.3 No Partial or Prorated Refunds
            </h4>
            <p>Except as expressly stated above:</p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>all fees are non-refundable</li>
              <li>no partial refunds are issued</li>
              <li>no prorated refunds are provided for unused time or early termination</li>
            </ul>
          </section>

          {/* 5. NO OUTCOME GUARANTEES */}
          <section>
            <h3 className="text-base font-semibold mb-3" style={{ color: 'var(--color-text-primary)' }}>
              5. No Outcome Guarantees
            </h3>
            <p className="mb-2">TurnKey does not guarantee:</p>
            <ul className="list-disc list-inside space-y-1 ml-2 mb-3">
              <li>sales</li>
              <li>revenue</li>
              <li>pricing improvements</li>
              <li>deal closures</li>
              <li>business outcomes of any kind</li>
            </ul>
            <p>
              TurnKey records data as entered by the user. Interpretation, use, and decision-making based on that data remain the sole responsibility of the user.
            </p>
          </section>

          {/* 6. USER RESPONSIBILITIES */}
          <section>
            <h3 className="text-base font-semibold mb-3" style={{ color: 'var(--color-text-primary)' }}>
              6. User Responsibilities
            </h3>
            <p className="mb-2">You are solely responsible for:</p>
            <ul className="list-disc list-inside space-y-1 ml-2 mb-3">
              <li>the accuracy of all data you enter</li>
              <li>pricing decisions you record</li>
              <li>actions taken based on recorded data</li>
            </ul>
            <p>
              TurnKey does not validate, verify, or audit user-entered information.
            </p>
          </section>

          {/* 7. PROHIBITED USE */}
          <section>
            <h3 className="text-base font-semibold mb-3" style={{ color: 'var(--color-text-primary)' }}>
              7. Prohibited Use
            </h3>
            <p className="mb-2">You may not:</p>
            <ul className="list-disc list-inside space-y-1 ml-2 mb-3">
              <li>use TurnKey to misrepresent pricing data</li>
              <li>attempt to reverse engineer the Service</li>
              <li>share account access without authorization</li>
              <li>use the Service for unlawful purposes</li>
            </ul>
            <p>
              Violation may result in suspension or termination without refund.
            </p>
          </section>

          {/* 8. TERMINATION */}
          <section>
            <h3 className="text-base font-semibold mb-3" style={{ color: 'var(--color-text-primary)' }}>
              8. Termination
            </h3>
            <p className="mb-3">
              You may cancel your subscription at any time. Cancellation stops renewal but does not entitle you to a refund outside the Evaluation Period.
            </p>
            <p>
              TurnKey reserves the right to suspend or terminate accounts that violate these Terms.
            </p>
          </section>

          {/* 9. INTELLECTUAL PROPERTY */}
          <section>
            <h3 className="text-base font-semibold mb-3" style={{ color: 'var(--color-text-primary)' }}>
              9. Intellectual Property
            </h3>
            <p className="mb-3">
              All software, content, and systems comprising TurnKey are the exclusive property of the Service provider.
            </p>
            <p>
              You are granted a limited, non-exclusive, non-transferable license to use the Service during an active subscription.
            </p>
          </section>

          {/* 10. LIMITATION OF LIABILITY */}
          <section>
            <h3 className="text-base font-semibold mb-3" style={{ color: 'var(--color-text-primary)' }}>
              10. Limitation of Liability
            </h3>
            <p className="mb-2">To the maximum extent permitted by law, TurnKey shall not be liable for:</p>
            <ul className="list-disc list-inside space-y-1 ml-2 mb-3">
              <li>lost revenue</li>
              <li>lost deals</li>
              <li>business interruption</li>
              <li>indirect or consequential damages</li>
            </ul>
            <p>
              Total liability shall not exceed the amount paid by you for the current subscription term.
            </p>
          </section>

          {/* 11. DISCLAIMER OF WARRANTIES */}
          <section>
            <h3 className="text-base font-semibold mb-3" style={{ color: 'var(--color-text-primary)' }}>
              11. Disclaimer of Warranties
            </h3>
            <p className="mb-3">
              The Service is provided "as is" and "as available."
            </p>
            <p>
              TurnKey makes no warranties, express or implied, including fitness for a particular purpose.
            </p>
          </section>

          {/* 12. CHARGEBACKS */}
          <section>
            <h3 className="text-base font-semibold mb-3" style={{ color: 'var(--color-text-primary)' }}>
              12. Chargebacks & Payment Disputes
            </h3>
            <p className="mb-3">
              By subscribing, you agree not to initiate chargebacks or payment disputes for fees that comply with these Terms.
            </p>
            <p>
              Unauthorized chargebacks may result in account suspension and recovery of associated costs.
            </p>
          </section>

          {/* 13. MODIFICATIONS */}
          <section>
            <h3 className="text-base font-semibold mb-3" style={{ color: 'var(--color-text-primary)' }}>
              13. Modifications
            </h3>
            <p>
              TurnKey may update these Terms from time to time. Continued use of the Service constitutes acceptance of updated Terms.
            </p>
          </section>

          {/* 14. GOVERNING LAW */}
          <section>
            <h3 className="text-base font-semibold mb-3" style={{ color: 'var(--color-text-primary)' }}>
              14. Governing Law
            </h3>
            <p>
              These Terms are governed by the laws of the State of California, United States, without regard to conflict of law principles.
            </p>
          </section>

          {/* 15. CONTACT */}
          <section>
            <h3 className="text-base font-semibold mb-3" style={{ color: 'var(--color-text-primary)' }}>
              15. Contact
            </h3>
            <p className="mb-2">For legal notices or refund requests:</p>
            <p>Email: support@nvisionfilms.com</p>
            <p>Company: NVision Films LLC</p>
          </section>

          {/* FINAL NOTE */}
          <section className="pt-6 mt-6" style={{ borderTop: '1px solid var(--color-border)' }}>
            <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
              This Terms of Service intentionally avoids success language, motivational framing, and performance promises. TurnKey exists to record pricing decisions, not to evaluate or justify them.
            </p>
          </section>

          <p className="text-xs pt-4" style={{ color: 'var(--color-text-muted)' }}>
            Last updated: December 24, 2024
          </p>
        </div>
      </div>
    </div>
  );
}
