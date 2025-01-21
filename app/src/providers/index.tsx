import { Button } from '@/components/ui/Button';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Suspense } from 'react';
import { ErrorBoundary, FallbackProps } from 'react-error-boundary';
import { HelmetProvider } from 'react-helmet-async';
import { BrowserRouter, Link } from 'react-router-dom';
import ThemeProvider from './theme-provider';
import { Toaster } from '@/components/ui/toaster';

const APP_ENV = import.meta.env.VITE_APP_ENV;

// eslint-disable-next-line react-refresh/only-export-components
export const queryClient = new QueryClient();

const ErrorFallback = ({ error }: FallbackProps) => {
  console.log('error', error);
  return APP_ENV !== 'production' ? (
    <div
      className="flex h-screen w-screen flex-col items-center justify-center text-red-500"
      role="alert"
    >
      <h2 className="text-2xl font-semibold">Oops! something went wrong.</h2>
      <pre className="text-2xl font-bold">{error.message}</pre>
      <pre>{error.stack}</pre>
      <Button className="mt-4" asChild>
        <Link to="/">Back to home</Link>
      </Button>
    </div>
  ) : (
    <></>
  );
};

export default function AppProvider({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <Suspense>
      <HelmetProvider>
        <BrowserRouter>
          <ErrorBoundary FallbackComponent={ErrorFallback}>
            <QueryClientProvider client={queryClient}>
              <ThemeProvider defaultTheme="light" storageKey="vite-ui-theme">
                <Toaster />
                {children}
              </ThemeProvider>
            </QueryClientProvider>
          </ErrorBoundary>
        </BrowserRouter>
      </HelmetProvider>
    </Suspense>
  );
}
