export const metadata = { title: 'Forgot Password' };

export default function ForgotPasswordPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="w-full max-w-md p-8 bg-surface border border-border rounded-xl">
        <h1 className="text-heading text-xl text-text-primary mb-2 text-center">Forgot Password</h1>
        <p className="text-text-secondary text-sm text-center mb-6">Enter your email to receive a password reset link.</p>
        <div className="space-y-4">
          <div className="h-10 rounded-lg bg-surface-hover animate-pulse" />
          <div className="h-10 rounded-lg bg-surface-hover animate-pulse" />
        </div>
      </div>
    </div>
  );
}
