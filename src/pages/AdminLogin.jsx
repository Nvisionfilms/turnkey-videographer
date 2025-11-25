import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Shield, LogIn } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { apiCall, API_ENDPOINTS } from "../config/api";

export default function AdminLogin() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await apiCall(API_ENDPOINTS.adminLogin, {
        method: 'POST',
        body: JSON.stringify({ email, password })
      });

      // Store admin token
      localStorage.setItem('adminToken', response.token || 'admin-logged-in');
      localStorage.setItem('adminEmail', email);

      toast({
        title: "Welcome back!",
        description: "Successfully logged in as admin",
      });

      navigate('/admin/analytics');
    } catch (error) {
      toast({
        title: "Login Failed",
        description: error.message || "Invalid email or password",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'var(--color-bg-primary)' }}>
      <Card className="w-full max-w-md" style={{ background: 'var(--color-bg-secondary)', borderColor: 'var(--color-border)' }}>
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="p-4 rounded-full" style={{ background: 'rgba(212, 175, 55, 0.1)' }}>
              <Shield className="w-12 h-12" style={{ color: 'var(--color-accent-primary)' }} />
            </div>
          </div>
          <CardTitle className="text-2xl" style={{ color: 'var(--color-text-primary)' }}>
            Admin Login
          </CardTitle>
          <p className="text-sm mt-2" style={{ color: 'var(--color-text-secondary)' }}>
            Enter your admin credentials to access the dashboard
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="email" style={{ color: 'var(--color-text-secondary)' }}>
                Email Address
              </Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@example.com"
                required
                style={{ 
                  background: 'var(--color-bg-primary)', 
                  borderColor: 'var(--color-border-dark)',
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
                required
                style={{ 
                  background: 'var(--color-bg-primary)', 
                  borderColor: 'var(--color-border-dark)',
                  color: 'var(--color-text-primary)'
                }}
              />
            </div>
            <Button
              type="submit"
              className="w-full"
              disabled={loading}
              style={{ background: 'var(--color-accent-primary)', color: '#000' }}
            >
              <LogIn className="w-4 h-4 mr-2" />
              {loading ? 'Signing in...' : 'Sign In'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
