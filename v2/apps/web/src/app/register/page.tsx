'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { toast } from 'sonner';

export default function RegisterPage() {
  const { register } = useAuth();
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirm) {
      toast.error('Passwords do not match');
      return;
    }
    setLoading(true);
    try {
      await register(email, username, password);
    } catch (err: any) {
      toast.error(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      {/* Ambient orbs */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[30%] right-[15%] w-[400px] h-[400px] rounded-full bg-neon-cyan/[0.06] blur-[100px] animate-orb-1" />
        <div className="absolute bottom-[20%] left-[10%] w-[350px] h-[350px] rounded-full bg-primary/[0.08] blur-[90px] animate-orb-2" />
      </div>

      <div className="relative z-10 w-full max-w-md animate-fade-up">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary via-neon-pink to-neon-cyan flex items-center justify-center text-white font-display font-bold text-sm shadow-lg shadow-primary/30">
              OP
            </div>
            <span className="text-2xl font-display font-bold gradient-text-subtle">OnlyPosts</span>
          </Link>
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-white/[0.06] bg-white/[0.03] backdrop-blur-2xl p-8 shadow-2xl shadow-black/20">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-display font-bold">Create your account</h1>
            <p className="text-sm text-muted-foreground mt-1">Start automating with AI agents</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username" className="text-xs uppercase tracking-wider text-muted-foreground">Username</Label>
              <Input
                id="username"
                placeholder="cooluser"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                className="h-11 bg-white/[0.04] border-white/[0.08] focus:border-primary/50 focus:bg-white/[0.06] transition-all"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email" className="text-xs uppercase tracking-wider text-muted-foreground">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="h-11 bg-white/[0.04] border-white/[0.08] focus:border-primary/50 focus:bg-white/[0.06] transition-all"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="password" className="text-xs uppercase tracking-wider text-muted-foreground">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={8}
                  className="h-11 bg-white/[0.04] border-white/[0.08] focus:border-primary/50 focus:bg-white/[0.06] transition-all"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm" className="text-xs uppercase tracking-wider text-muted-foreground">Confirm</Label>
                <Input
                  id="confirm"
                  type="password"
                  placeholder="••••••••"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  required
                  className="h-11 bg-white/[0.04] border-white/[0.08] focus:border-primary/50 focus:bg-white/[0.06] transition-all"
                />
              </div>
            </div>
            <Button type="submit" className="w-full h-11 text-base font-display" disabled={loading}>
              {loading ? <Spinner size="sm" /> : 'Create Account →'}
            </Button>
          </form>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/[0.06]" />
            </div>
          </div>

          <p className="text-sm text-center text-muted-foreground">
            Already have an account?{' '}
            <Link href="/login" className="text-primary hover:text-primary/80 font-medium transition-colors">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
