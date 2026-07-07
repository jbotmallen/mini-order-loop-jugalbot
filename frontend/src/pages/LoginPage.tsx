import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { ImageSide } from "../components/login/ImageSide";
import { LoginForm } from "@/components/login/LoginForm";
import Logo from "@/components/ui/Logo";

export function LoginPage() {
  const { isAuthenticated } = useAuth();

  // Already logged in — skip straight to the app.
  if (isAuthenticated) {
    return <Navigate to="/orders" replace />;
  }

  return (
    <div className="flex min-h-dvh items-center justify-between bg-surface text-on-surface">
      <ImageSide />
      <div className="flex h-full min-h-dvh w-full max-w-4xl flex-col items-center justify-center rounded-lg border border-outline-variant bg-surface-container-low p-8 shadow-sm">
        <div className="mb-6 gap-3 h-full w-full text-center flex items-center justify-center flex-col">
          <Logo hideText={true} className="mx-auto"/>
          <h1 className="text-2xl font-semibold tracking-tight">
            Login to your Account
          </h1>
          <p className="text-sm text-on-surface-variant/70">
            Enter your credentials to access the system
          </p>
        </div>

        <div className="h-full w-full max-w-md space-y-4">
          <LoginForm />
        </div>
      </div>
    </div>
  );
}
