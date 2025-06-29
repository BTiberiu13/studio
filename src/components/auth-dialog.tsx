
"use client";

import { useState } from "react";
import { GoogleAuthProvider, signInWithPopup, type AuthError } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Loader2 } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

// A simple SVG for the Google icon
const GoogleIcon = () => (
    <svg className="h-4 w-4" aria-hidden="true" focusable="false" data-prefix="fab" data-icon="google" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 488 512">
      <path fill="currentColor" d="M488 261.8C488 403.3 381.5 512 244 512S0 403.3 0 261.8 106.5 11.8 244 11.8c70.4 0 129.5 27.9 173.2 69.1l-63.5 61.8C324.4 121.3 287.1 98.3 244 98.3c-83.8 0-152.4 68.6-152.4 163.5s68.6 163.5 152.4 163.5c97.1 0 131.6-69.5 136.8-106.2H244v-81.4h236.1c2.4 12.8 3.9 26.6 3.9 41.2z"></path>
    </svg>
);

type AuthDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function AuthDialog({ open, onOpenChange }: AuthDialogProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    setError(null);

    if (!auth) {
        setError("Firebase is not configured. Please add credentials to your .env file.");
        setIsLoading(false);
        return;
    }

    const provider = new GoogleAuthProvider();

    try {
      await signInWithPopup(auth, provider);
      toast({ title: "Success", description: "You've been signed in with Google." });
      onOpenChange(false);
    } catch (e) {
      const authError = e as AuthError;
      switch (authError.code) {
        case 'auth/popup-closed-by-user':
          // User closed the popup, so we'll just ignore it.
          break;
        case 'auth/account-exists-with-different-credential':
          setError("An account already exists with the same email address but different sign-in credentials. Sign in using a provider associated with this email address.");
          break;
        default:
          setError(authError.message || "An unexpected error occurred.");
          break;
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Sign In</DialogTitle>
          <DialogDescription>
            Sign in with your Google account to save and manage your lists.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 pt-4">
            {error && (
            <Alert variant="destructive">
                <AlertTitle>Authentication Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
            </Alert>
            )}
            <Button onClick={handleGoogleSignIn} className="w-full" disabled={isLoading}>
            {isLoading ? (
                <Loader2 className="animate-spin" />
            ) : (
                <GoogleIcon />
            )}
            <span>{isLoading ? "Redirecting..." : "Sign in with Google"}</span>
            </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
