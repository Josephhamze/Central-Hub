import { useAuth } from '@contexts/AuthContext';
import { Clock, UserCheck, LogOut } from 'lucide-react';
import { Button } from '@components/ui/Button';

export function WelcomePage() {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-background-primary flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="bg-background-secondary rounded-xl border border-border-default p-8 text-center">
          <div className="w-16 h-16 bg-accent-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <Clock className="w-8 h-8 text-accent-primary" />
          </div>

          <h1 className="text-2xl font-bold text-content-primary mb-2">
            Welcome, {user?.firstName}!
          </h1>

          <p className="text-content-secondary mb-6">
            Your account has been created successfully. An administrator will review your account and assign appropriate access permissions.
          </p>

          <div className="bg-background-tertiary rounded-lg p-4 mb-6">
            <div className="flex items-center gap-3 text-left">
              <UserCheck className="w-5 h-5 text-accent-primary flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-content-primary">Pending Approval</p>
                <p className="text-xs text-content-tertiary">
                  You'll receive access once your role has been assigned.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <p className="text-sm text-content-tertiary">
              Please contact your administrator if you need immediate access.
            </p>

            <Button
              variant="secondary"
              onClick={logout}
              leftIcon={<LogOut className="w-4 h-4" />}
              className="w-full"
            >
              Sign Out
            </Button>
          </div>
        </div>

        <p className="text-center text-xs text-content-tertiary mt-4">
          Account: {user?.email}
        </p>
      </div>
    </div>
  );
}
