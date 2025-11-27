import { Navigate } from "react-router-dom";
import { useAuth } from "@/lib/auth-context";
import { Loading } from "./loading";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isSignedIn, isLoading } = useAuth();

  if (isLoading) {
    return <Loading />;
  }

  if (!isSignedIn) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
