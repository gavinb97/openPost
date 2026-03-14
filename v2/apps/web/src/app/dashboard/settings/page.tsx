'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/auth';
import { authApi, billingApi } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { toast } from 'sonner';

export default function SettingsPage() {
  const { user, refresh } = useAuth();
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState({ username: user?.username || '', email: user?.email || '' });
  const [passwords, setPasswords] = useState({ current_password: '', new_password: '', confirm: '' });

  const updateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await authApi.updateProfile(profile);
      await refresh();
      toast.success('Profile updated');
    } catch (err: any) {
      toast.error(err.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const updatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwords.new_password !== passwords.confirm) {
      toast.error('Passwords do not match');
      return;
    }
    setLoading(true);
    try {
      await authApi.updatePassword({
        current_password: passwords.current_password,
        new_password: passwords.new_password,
      });
      setPasswords({ current_password: '', new_password: '', confirm: '' });
      toast.success('Password updated');
    } catch (err: any) {
      toast.error(err.message || 'Failed to update password');
    } finally {
      setLoading(false);
    }
  };

  const openBillingPortal = async () => {
    try {
      const { url } = await billingApi.portal();
      window.location.href = url;
    } catch {
      // If no subscription, go to checkout
      try {
        const { url } = await billingApi.checkout();
        window.location.href = url;
      } catch (err: any) {
        toast.error(err.message || 'Billing not available');
      }
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground mt-1">Manage your account and preferences</p>
      </div>

      {/* Profile */}
      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={updateProfile} className="space-y-4">
            <div>
              <Label>Username</Label>
              <Input
                value={profile.username}
                onChange={(e) => setProfile({ ...profile, username: e.target.value })}
              />
            </div>
            <div>
              <Label>Email</Label>
              <Input
                type="email"
                value={profile.email}
                onChange={(e) => setProfile({ ...profile, email: e.target.value })}
              />
            </div>
            <Button type="submit" disabled={loading}>
              {loading ? <Spinner size="sm" /> : 'Save Changes'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Password */}
      <Card>
        <CardHeader>
          <CardTitle>Change Password</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={updatePassword} className="space-y-4">
            <div>
              <Label>Current Password</Label>
              <Input
                type="password"
                value={passwords.current_password}
                onChange={(e) => setPasswords({ ...passwords, current_password: e.target.value })}
              />
            </div>
            <div>
              <Label>New Password</Label>
              <Input
                type="password"
                value={passwords.new_password}
                onChange={(e) => setPasswords({ ...passwords, new_password: e.target.value })}
              />
            </div>
            <div>
              <Label>Confirm New Password</Label>
              <Input
                type="password"
                value={passwords.confirm}
                onChange={(e) => setPasswords({ ...passwords, confirm: e.target.value })}
              />
            </div>
            <Button type="submit" disabled={loading}>
              {loading ? <Spinner size="sm" /> : 'Update Password'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Billing */}
      <Card>
        <CardHeader>
          <CardTitle>Billing</CardTitle>
          <CardDescription>
            Current plan: <span className="font-medium capitalize">{user?.tier || 'free'}</span>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="outline" onClick={openBillingPortal}>
            {user?.tier === 'pro' ? 'Manage Subscription' : 'Upgrade to Pro — $29.99/mo'}
          </Button>
          <p className="text-xs text-muted-foreground mt-2">
            Pro includes unlimited agents, priority support, and advanced analytics.
          </p>
        </CardContent>
      </Card>

      {/* Danger zone */}
      <Card className="border-destructive/50">
        <CardHeader>
          <CardTitle className="text-destructive">Danger Zone</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            Deleting your account will permanently remove all your data, agents, and connected accounts.
          </p>
          <Button variant="destructive" onClick={() => toast.error('Account deletion is not yet implemented')}>
            Delete Account
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
