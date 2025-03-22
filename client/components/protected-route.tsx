"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";

export default function ProtectedRoute({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isSignedIn } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isSignedIn) {
      router.push("/signin");
    }
  }, [isSignedIn, router]);

  if (!isSignedIn) {
    return null; // Or a loading spinner
  }

  return <>{children}</>;
}
