import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LogIn } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { apiCall, API_ENDPOINTS } from "../config/api";

export default function AffiliateLogin() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');

    if (!email.trim() || !password.trim()) {
      setError('Email and password are required');
      return;
    }

    try {
      // Check if this is admin login
      if (email.toLowerCase() === 'nvisionmg@gmail.com') {
        // Try admin login
        try {
          const adminResponse = await apiCall(API_ENDPOINTS.adminLogin, {
            method: 'POST',
            body: JSON.stringify({ email, password })
          });

          // Store admin token
          if (adminResponse.success) {
            localStorage.setItem('adminToken', 'admin-logged-in');
            localStorage.setItem('adminEmail', email);
            console.log('Admin logged in successfully');
            
            // Force navigation with window.location for clean state
            window.location.href = '/admin/dashboard';
            return;
          }
          
          setError('Login failed');
          return;
        } catch (adminError) {
          // If admin login fails, show error
          console.error('Admin login error:', adminError);
          setError('Invalid admin credentials');
          return;
        }
      }

      // Regular affiliate login
      const response = await apiCall(API_ENDPOINTS.affiliateLogin, {
        method: 'POST',
        body: JSON.stringify({
          email,
          password
        })
      });

      const affiliate = response.affiliate;

      toast({
        title: "Welcome back!",
        description: `Logged in as ${affiliate.name}`,
      });

      navigate(`/affiliate/dashboard?code=${affiliate.code}`);
    } catch (error) {
      setError(error.message || 'Invalid email or password');
      toast({
        title: "Login Failed",
        description: error.message || 'Invalid email or password',
        variant: "destructive"
      });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--color-bg-primary)' }}>
      <div className="w-full max-w-md px-6">
        <Card style={{ background: 'var(--color-bg-secondary)', borderColor: 'var(--color-border)' }}>
          <CardHeader className="text-center">
            <CardTitle className="text-2xl" style={{ color: 'var(--color-text-primary)' }}>
              Affiliate Login
            </CardTitle>
            <p className="text-sm mt-2" style={{ color: 'var(--color-text-secondary)' }}>
              Enter your credentials to access your dashboard
            </p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
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
                    borderColor: error ? 'var(--color-error)' : 'var(--color-border)',
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
                    borderColor: error ? 'var(--color-error)' : 'var(--color-border)',
                    color: 'var(--color-text-primary)' 
                  }}
                />
                {error && (
                  <p className="text-xs mt-1" style={{ color: 'var(--color-error)' }}>
                    {error}
                  </p>
                )}
              </div>

              <Button
                type="submit"
                className="w-full"
                style={{ background: 'var(--color-accent-primary)', color: '#000' }}
              >
                <LogIn className="w-4 h-4 mr-2" />
                Login
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                Don't have an account?{' '}
                <a 
                  href="/affiliate/signup" 
                  className="font-semibold hover:underline"
                  style={{ color: 'var(--color-accent-primary)' }}
                >
                  Sign up now
                </a>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
