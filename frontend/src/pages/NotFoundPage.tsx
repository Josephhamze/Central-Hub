import { Link } from 'react-router-dom';
import { Home, ArrowLeft } from 'lucide-react';
import { Button } from '@components/ui/Button';

export function NotFoundPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background-secondary p-4">
      <div className="text-center max-w-md">
        <div className="mb-8">
          <span className="text-8xl font-bold text-content-muted">404</span>
        </div>
        <h1 className="text-2xl font-semibold text-content-primary mb-2">
          Page not found
        </h1>
        <p className="text-content-tertiary mb-8">
          Sorry, we couldn't find the page you're looking for. It might have been
          moved or doesn't exist.
        </p>
        <div className="flex items-center justify-center gap-4">
          <Button
            variant="secondary"
            onClick={() => window.history.back()}
            leftIcon={<ArrowLeft className="w-4 h-4" />}
          >
            Go back
          </Button>
          <Link to="/">
            <Button leftIcon={<Home className="w-4 h-4" />}>Go home</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
