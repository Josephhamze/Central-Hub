import { useState } from 'react';
import { User, Mail, Lock, Eye, EyeOff, Save } from 'lucide-react';
import { useAuth } from '@contexts/AuthContext';
import { useTheme } from '@contexts/ThemeContext';
import { useToast } from '@contexts/ToastContext';
import { PageContainer } from '@components/layout/PageContainer';
import { Card, CardHeader } from '@components/ui/Card';
import { Button } from '@components/ui/Button';
import { Input } from '@components/ui/Input';
import { Badge } from '@components/ui/Badge';
import { api, getErrorMessage } from '@services/api';

export function ProfilePage() {
  const { user } = useAuth();
  const { theme, setTheme } = useTheme();
  const { success, error } = useToast();

  const [firstName, setFirstName] = useState(user?.firstName || '');
  const [lastName, setLastName] = useState(user?.lastName || '');
  const [email, setEmail] = useState(user?.email || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdatingProfile(true);

    try {
      await api.put('/users/me', { firstName, lastName, email });
      success('Profile updated successfully');
    } catch (err) {
      error(getErrorMessage(err));
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      error('Passwords do not match');
      return;
    }

    if (newPassword.length < 8) {
      error('Password must be at least 8 characters');
      return;
    }

    setIsUpdatingPassword(true);

    try {
      await api.put('/users/me', { currentPassword, newPassword });
      success('Password updated successfully');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      error(getErrorMessage(err));
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  const handleThemeChange = async (newTheme: 'light' | 'dark' | 'system') => {
    setTheme(newTheme);
    try {
      await api.patch('/users/me/theme', {
        theme: newTheme.toUpperCase(),
      });
    } catch {
      // Theme preference save failed - user will just use default next time
    }
  };

  return (
    <PageContainer
      title="Profile"
      description="Manage your account settings and preferences"
    >
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* User Info */}
        <Card className="lg:col-span-2">
          <CardHeader
            title="Personal Information"
            description="Update your profile details"
          />
          <form onSubmit={handleUpdateProfile} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="First name"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                leftIcon={<User className="w-4 h-4" />}
              />
              <Input
                label="Last name"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
              />
            </div>
            <Input
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              leftIcon={<Mail className="w-4 h-4" />}
            />
            <div className="flex justify-end">
              <Button
                type="submit"
                isLoading={isUpdatingProfile}
                leftIcon={<Save className="w-4 h-4" />}
              >
                Save Changes
              </Button>
            </div>
          </form>
        </Card>

        {/* Account Overview */}
        <Card>
          <CardHeader title="Account" />
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-accent-primary/10 flex items-center justify-center">
                <span className="text-xl font-semibold text-accent-primary">
                  {user?.firstName?.[0]}
                  {user?.lastName?.[0]}
                </span>
              </div>
              <div>
                <p className="font-medium text-content-primary">
                  {user?.firstName} {user?.lastName}
                </p>
                <p className="text-sm text-content-tertiary">{user?.email}</p>
              </div>
            </div>
            <div className="pt-4 border-t border-border-default">
              <p className="text-sm text-content-tertiary mb-2">Roles</p>
              <div className="flex flex-wrap gap-2">
                {user?.roles?.map((role: string) => (
                  <Badge key={role} variant="info">
                    {role}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        </Card>

        {/* Password */}
        <Card className="lg:col-span-2">
          <CardHeader
            title="Change Password"
            description="Update your account password"
          />
          <form onSubmit={handleUpdatePassword} className="space-y-4">
            <Input
              label="Current password"
              type={showPassword ? 'text' : 'password'}
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              leftIcon={<Lock className="w-4 h-4" />}
              rightIcon={
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="p-1"
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              }
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="New password"
                type={showPassword ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                leftIcon={<Lock className="w-4 h-4" />}
              />
              <Input
                label="Confirm new password"
                type={showPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                leftIcon={<Lock className="w-4 h-4" />}
              />
            </div>
            <div className="flex justify-end">
              <Button
                type="submit"
                isLoading={isUpdatingPassword}
                leftIcon={<Lock className="w-4 h-4" />}
              >
                Update Password
              </Button>
            </div>
          </form>
        </Card>

        {/* Theme Preference */}
        <Card>
          <CardHeader
            title="Appearance"
            description="Choose your preferred theme"
          />
          <div className="space-y-2">
            {(['light', 'dark', 'system'] as const).map((option) => (
              <button
                key={option}
                onClick={() => handleThemeChange(option)}
                className={`w-full flex items-center justify-between p-3 rounded-lg transition-colors ${
                  theme === option
                    ? 'bg-accent-primary/10 text-accent-primary'
                    : 'hover:bg-background-hover text-content-secondary'
                }`}
              >
                <span className="capitalize">{option}</span>
                {theme === option && (
                  <div className="w-2 h-2 rounded-full bg-accent-primary" />
                )}
              </button>
            ))}
          </div>
        </Card>
      </div>
    </PageContainer>
  );
}


