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

        <h1 className="text-2xl font-semibold mb-2" style={{ color: 'var(--color-text-primary)' }}>
          TurnKey Pricing Ledger
        </h1>
        <h2 className="text-lg mb-8" style={{ color: 'var(--color-text-muted)' }}>
          Privacy Policy
        </h2>

        <p className="text-xs mb-8" style={{ color: 'var(--color-text-muted)' }}>
          Effective Date: December 24, 2024
        </p>

        <div className="space-y-8 text-sm leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
          
          <p>
            This Privacy Policy describes how TurnKey Pricing Ledger ("TurnKey," "we," "us") collects, uses, stores, and protects information in connection with the TurnKey platform ("Service").
          </p>
          <p className="font-medium" style={{ color: 'var(--color-text-primary)' }}>
            By using the Service, you consent to the practices described below.
          </p>

          {/* 1. INFORMATION WE COLLECT */}
          <section>
            <h3 className="text-base font-semibold mb-3" style={{ color: 'var(--color-text-primary)' }}>
              1. Information We Collect
            </h3>
            
            <h4 className="text-sm font-medium mb-2" style={{ color: 'var(--color-text-primary)' }}>
              1.1 Information You Provide
            </h4>
            <p className="mb-2">We collect information you voluntarily submit, including:</p>
            <ul className="list-disc list-inside space-y-1 ml-2 mb-3">
              <li>Account information (name, email address)</li>
              <li>Pricing decisions and related records entered into the Service</li>
              <li>Notes, metadata, timestamps, and other ledger-related inputs</li>
              <li>Communications sent to us (support requests, refund requests)</li>
            </ul>
            <p className="mb-4">TurnKey does not verify or validate the accuracy of user-entered data.</p>
            
            <h4 className="text-sm font-medium mb-2" style={{ color: 'var(--color-text-primary)' }}>
              1.2 Automatically Collected Information
            </h4>
            <p className="mb-2">We may automatically collect limited technical data, including:</p>
            <ul className="list-disc list-inside space-y-1 ml-2 mb-3">
              <li>IP address</li>
              <li>Device type and browser</li>
              <li>Access timestamps</li>
              <li>Log data related to system usage</li>
            </ul>
            <p>This data is used for system operation, security, and abuse prevention.</p>
          </section>

          {/* 2. HOW WE USE INFORMATION */}
          <section>
            <h3 className="text-base font-semibold mb-3" style={{ color: 'var(--color-text-primary)' }}>
              2. How We Use Information
            </h3>
            <p className="mb-2">We use collected information only to:</p>
            <ul className="list-disc list-inside space-y-1 ml-2 mb-4">
              <li>operate and maintain the Service</li>
              <li>store and display user pricing records</li>
              <li>enforce subscription terms and usage requirements</li>
              <li>process payments, refunds, and account actions</li>
              <li>respond to support or legal inquiries</li>
            </ul>
            <p className="mb-2">TurnKey does not use user data to:</p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>provide pricing advice</li>
              <li>suggest decisions</li>
              <li>evaluate outcomes</li>
              <li>rank or score users</li>
            </ul>
          </section>

          {/* 3. DATA OWNERSHIP */}
          <section>
            <h3 className="text-base font-semibold mb-3" style={{ color: 'var(--color-text-primary)' }}>
              3. Data Ownership & Responsibility
            </h3>
            <p className="mb-3">You retain ownership of all pricing data and records you enter.</p>
            <p className="mb-2">You are solely responsible for:</p>
            <ul className="list-disc list-inside space-y-1 ml-2 mb-3">
              <li>the content you submit</li>
              <li>decisions recorded in the ledger</li>
              <li>how recorded data is interpreted or used</li>
            </ul>
            <p>TurnKey acts only as a data recording and storage system.</p>
          </section>

          {/* 4. DATA SHARING */}
          <section>
            <h3 className="text-base font-semibold mb-3" style={{ color: 'var(--color-text-primary)' }}>
              4. Data Sharing
            </h3>
            <p className="mb-3 font-medium" style={{ color: 'var(--color-text-primary)' }}>
              TurnKey does not sell user data.
            </p>
            <p className="mb-2">We may share data only in the following limited circumstances:</p>
            <ul className="list-disc list-inside space-y-1 ml-2 mb-3">
              <li>with service providers necessary to operate the platform (e.g., hosting, payment processing)</li>
              <li>to comply with legal obligations, subpoenas, or lawful requests</li>
              <li>to protect the rights, property, or safety of TurnKey or others</li>
            </ul>
            <p>All third-party providers are required to maintain reasonable confidentiality and security standards.</p>
          </section>

          {/* 5. DATA RETENTION */}
          <section>
            <h3 className="text-base font-semibold mb-3" style={{ color: 'var(--color-text-primary)' }}>
              5. Data Retention
            </h3>
            <p className="mb-2">We retain user data:</p>
            <ul className="list-disc list-inside space-y-1 ml-2 mb-3">
              <li>for the duration of an active subscription</li>
              <li>as required for legal, accounting, or dispute resolution purposes</li>
            </ul>
            <p className="mb-3">Upon account termination, data may be retained for a limited period consistent with operational and legal requirements.</p>
            <p>TurnKey does not guarantee permanent data retention after account closure.</p>
          </section>

          {/* 6. SECURITY */}
          <section>
            <h3 className="text-base font-semibold mb-3" style={{ color: 'var(--color-text-primary)' }}>
              6. Security
            </h3>
            <p className="mb-3">We implement reasonable administrative and technical safeguards to protect stored information.</p>
            <p className="mb-2">However:</p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>no system is completely secure</li>
              <li>TurnKey cannot guarantee absolute security</li>
              <li>users are responsible for maintaining the confidentiality of their credentials</li>
            </ul>
          </section>

          {/* 7. USER ACCESS */}
          <section>
            <h3 className="text-base font-semibold mb-3" style={{ color: 'var(--color-text-primary)' }}>
              7. User Access & Control
            </h3>
            <p className="mb-2">You may:</p>
            <ul className="list-disc list-inside space-y-1 ml-2 mb-3">
              <li>access and update account information</li>
              <li>export or review recorded pricing data while your account is active</li>
              <li>request account termination</li>
            </ul>
            <p>Data deletion requests are subject to legal and operational retention requirements.</p>
          </section>

          {/* 8. COOKIES */}
          <section>
            <h3 className="text-base font-semibold mb-3" style={{ color: 'var(--color-text-primary)' }}>
              8. Cookies & Tracking
            </h3>
            <p className="mb-2">TurnKey may use limited cookies or similar technologies strictly for:</p>
            <ul className="list-disc list-inside space-y-1 ml-2 mb-3">
              <li>authentication</li>
              <li>session management</li>
              <li>affiliate referral tracking</li>
            </ul>
            <p>We do not use behavioral advertising trackers.</p>
          </section>

          {/* 9. CHILDREN */}
          <section>
            <h3 className="text-base font-semibold mb-3" style={{ color: 'var(--color-text-primary)' }}>
              9. Children's Privacy
            </h3>
            <p className="mb-3">TurnKey is not intended for individuals under the age of 18.</p>
            <p>We do not knowingly collect data from minors.</p>
          </section>

          {/* 10. INTERNATIONAL */}
          <section>
            <h3 className="text-base font-semibold mb-3" style={{ color: 'var(--color-text-primary)' }}>
              10. International Users
            </h3>
            <p>
              If you access the Service from outside the United States, you acknowledge that your data may be transferred to and processed in the United States.
            </p>
          </section>

          {/* 11. CHANGES */}
          <section>
            <h3 className="text-base font-semibold mb-3" style={{ color: 'var(--color-text-primary)' }}>
              11. Changes to This Policy
            </h3>
            <p className="mb-3">We may update this Privacy Policy periodically.</p>
            <p>Continued use of the Service after changes constitutes acceptance of the updated policy.</p>
          </section>

          {/* 12. CONTACT */}
          <section>
            <h3 className="text-base font-semibold mb-3" style={{ color: 'var(--color-text-primary)' }}>
              12. Contact Information
            </h3>
            <p className="mb-2">For privacy-related inquiries:</p>
            <p>Email: support@nvisionfilms.com</p>
            <p>Company: NVision Films LLC</p>
          </section>

          {/* GOVERNANCE NOTE */}
          <section className="pt-6 mt-6" style={{ borderTop: '1px solid var(--color-border)' }}>
            <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
              This Privacy Policy avoids aspirational claims, trust-marketing language, and emotional reassurance. TurnKey records pricing decisions. It stores data necessary to do that. Nothing more.
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
