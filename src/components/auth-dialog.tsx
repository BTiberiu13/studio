
"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  type AuthError,
} from "firebase/auth";
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
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const formSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email." }),
  password: z
    .string()
    .min(6, { message: "Password must be at least 6 characters." }),
});

type FormValues = z.infer<typeof formSchema>;

type AuthDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function AuthDialog({ open, onOpenChange }: AuthDialogProps) {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("signin");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { register, handleSubmit, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
  });

  const handleAuth = async (data: FormValues) => {
    setIsLoading(true);
    setError(null);

    if (!auth) {
        setError("Firebase is not configured. Please add credentials to your .env file.");
        setIsLoading(false);
        return;
    }

    try {
      if (activeTab === "signin") {
        await signInWithEmailAndPassword(auth, data.email, data.password);
        toast({ title: "Success", description: "You've been signed in." });
      } else {
        await createUserWithEmailAndPassword(auth, data.email, data.password);
        toast({ title: "Welcome!", description: "Your account has been created." });
      }
      onOpenChange(false);
    } catch (e) {
      const authError = e as AuthError;
      setError(authError.message || "An unexpected error occurred.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {activeTab === "signin" ? "Sign In" : "Create Account"}
          </DialogTitle>
          <DialogDescription>
            {activeTab === "signin"
              ? "Access your saved lists and plans."
              : "Join to start saving your travel plans."}
          </DialogDescription>
        </DialogHeader>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="signin">Sign In</TabsTrigger>
            <TabsTrigger value="signup">Sign Up</TabsTrigger>
          </TabsList>
          <TabsContent value="signin">
            <AuthForm onSubmit={handleAuth} register={register} errors={errors} isLoading={isLoading} error={error} />
          </TabsContent>
          <TabsContent value="signup">
            <AuthForm onSubmit={handleAuth} register={register} errors={errors} isLoading={isLoading} error={error} />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

// Sub-component for the form to avoid repetition
function AuthForm({ onSubmit, register, errors, isLoading, error }: any) {
  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-4">
       {error && (
        <Alert variant="destructive">
          <AlertTitle>Authentication Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input id="email" type="email" {...register("email")} />
        {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
      </div>
      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <Input id="password" type="password" {...register("password")} />
        {errors.password && <p className="text-sm text-destructive">{errors.password.message}</p>}
      </div>
      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {isLoading ? "Processing..." : "Continue"}
      </Button>
    </form>
  )
}
