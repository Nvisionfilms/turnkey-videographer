import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Trash2, AlertTriangle } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { apiCall, API_BASE_URL } from "../config/api";

export default function DeleteAccount() {
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmText, setConfirmText] = useState('');
  const [loading, setLoading] = useState(false);
  const [deleted, setDeleted] = useState(false);
  const [error, setError] = useState('');

  const handleDelete = async (e) => {
    e.preventDefault();
    setError('');

    if (!email.trim() || !password.trim()) {
      setError('Email and password are required');
      return;
    }

    if (confirmText !== 'DELETE') {
      setError('Please type DELETE to confirm');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/api/affiliates/delete-account`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || data.message || 'Failed to delete account');
      }

      setDeleted(true);
      toast({
        title: "Account Deleted",
        description: "Your account and all associated data have been permanently deleted.",
      });
    } catch (error) {
      setError(error.message || 'Failed to delete account');
      toast({
        title: "Error",
        description: error.message || 'Failed to delete account',
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  if (deleted) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6" style={{ background: 'var(--color-bg-primary)' }}>
        <Card className="max-w-md w-full" style={{ background: 'var(--color-bg-secondary)', borderColor: 'var(--color-border)' }}>
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center" style={{ background: 'var(--color-success)', opacity: 0.2 }}>
              <Trash2 className="w-8 h-8" style={{ color: 'var(--color-success)' }} />
            </div>
            <h2 className="text-xl font-bold mb-2" style={{ color: 'var(--color-text-primary)' }}>
              Account Deleted
            </h2>
            <p style={{ color: 'var(--color-text-secondary)' }}>
              Your account and all associated data have been permanently deleted from our systems.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6" style={{ background: 'var(--color-bg-primary)' }}>
      <Card className="max-w-md w-full" style={{ background: 'var(--color-bg-secondary)', borderColor: 'var(--color-border)' }}>
        <CardHeader className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center" style={{ background: 'rgba(239, 68, 68, 0.2)' }}>
            <AlertTriangle className="w-8 h-8 text-red-500" />
          </div>
          <CardTitle className="text-2xl" style={{ color: 'var(--color-text-primary)' }}>
            Delete Account
          </CardTitle>
          <p className="text-sm mt-2" style={{ color: 'var(--color-text-secondary)' }}>
            This action is permanent and cannot be undone
          </p>
        </CardHeader>
        <CardContent>
          <Alert className="mb-6" style={{ background: 'rgba(239, 68, 68, 0.1)', borderColor: 'rgba(239, 68, 68, 0.3)' }}>
            <AlertDescription style={{ color: 'var(--color-text-primary)' }}>
              <strong>Warning:</strong> Deleting your account will permanently remove:
              <ul className="list-disc ml-4 mt-2 text-sm">
                <li>Your affiliate profile</li>
                <li>All referral history</li>
                <li>Pending payouts</li>
                <li>All associated data</li>
              </ul>
            </AlertDescription>
          </Alert>

          <form onSubmit={handleDelete} className="space-y-4">
            <div>
              <Label htmlFor="email" style={{ color: 'var(--color-text-secondary)' }}>
                Email Address
              </Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                style={{ 
                  background: 'var(--color-bg-primary)', 
                  borderColor: 'var(--color-border)',
                  color: 'var(--color-text-primary)' 
                }}
              />
            </div>

            <div>
              <Label htmlFor="password" style={{ color: 'var(--color-text-secondary)' }}>
                Password
              </Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                style={{ 
                  background: 'var(--color-bg-primary)', 
                  borderColor: 'var(--color-border)',
                  color: 'var(--color-text-primary)' 
                }}
              />
            </div>

            <div>
              <Label htmlFor="confirm" style={{ color: 'var(--color-text-secondary)' }}>
                Type DELETE to confirm
              </Label>
              <Input
                id="confirm"
                type="text"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                placeholder="DELETE"
                style={{ 
                  background: 'var(--color-bg-primary)', 
                  borderColor: error && confirmText !== 'DELETE' ? 'var(--color-error)' : 'var(--color-border)',
                  color: 'var(--color-text-primary)' 
                }}
              />
            </div>

            {error && (
              <p className="text-sm text-red-500">{error}</p>
            )}

            <Button
              type="submit"
              className="w-full"
              disabled={loading || confirmText !== 'DELETE'}
              variant="destructive"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              {loading ? 'Deleting...' : 'Permanently Delete Account'}
            </Button>
          </form>

          <p className="text-xs text-center mt-6" style={{ color: 'var(--color-text-muted)' }}>
            If you have questions, contact support at contact@nvisionfilms.com
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
