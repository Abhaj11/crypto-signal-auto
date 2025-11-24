"use client";

import { AuthProvider, useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useEffect, useState } from "react";
import { GiantOracleLogo } from "@/components/icons/giant-oracle-logo";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Terminal } from "lucide-react";


const signUpSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8, { message: "Password must be at least 8 characters." }),
});

const signInSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1, { message: "Password is required." }),
});

function AuthForm() {
  const { user, signUp, signIn, loading, error } = useAuth();
  const router = useRouter();
  const [authError, setAuthError] = useState<string | null>(null);

  const signUpForm = useForm<z.infer<typeof signUpSchema>>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const signInForm = useForm<z.infer<typeof signInSchema>>({
    resolver: zodResolver(signInSchema),
    defaultValues: {
      email: "pro@giantoracle.com",
      password: "password123",
    },
  });

  useEffect(() => {
    if (user) {
      router.push("/dashboard");
    }
  }, [user, router]);
  
  useEffect(() => {
    setAuthError(error);
  }, [error]);


  const handleSignUp = async (values: z.infer<typeof signUpSchema>) => {
    setAuthError(null);
    try {
        await signUp(values.email, values.password);
    } catch(e) {
        // Error is already set in the useAuth hook
    }
  };

  const handleSignIn = async (values: z.infer<typeof signInSchema>) => {
    setAuthError(null);
    try {
        await signIn(values.email, values.password);
    } catch(e) {
        // Error is already set in the useAuth hook
    }
  };

  if (loading && !authError) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <GiantOracleLogo className="h-16 w-16 animate-spin text-primary" />
      </div>
    );
  }
  
  if (user) {
      return null;
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Tabs defaultValue="sign-in" className="w-full max-w-md">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="sign-in" onClick={() => setAuthError(null)}>Sign In</TabsTrigger>
          <TabsTrigger value="sign-up" onClick={() => setAuthError(null)}>Sign Up</TabsTrigger>
        </TabsList>

        {/* Sign In Tab */}
        <TabsContent value="sign-in">
          <Card>
            <CardHeader>
              <CardTitle>Sign In</CardTitle>
              <CardDescription>
                Welcome back! Sign in to access your dashboard.
              </CardDescription>
            </CardHeader>
            <Form {...signInForm}>
              <form onSubmit={signInForm.handleSubmit(handleSignIn)}>
                <CardContent className="space-y-4">
                   <Alert>
                      <Terminal className="h-4 w-4" />
                      <AlertTitle>Admin Access</AlertTitle>
                      <AlertDescription>
                        Use the pre-filled credentials for full access.
                      </AlertDescription>
                    </Alert>
                  <FormField
                    control={signInForm.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="pro@giantoracle.com"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={signInForm.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Password</FormLabel>
                        <FormControl>
                          <Input type="password" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                   {authError && <p className="text-sm font-medium text-destructive">{authError}</p>}
                </CardContent>
                <CardFooter>
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Sign In
                  </Button>
                </CardFooter>
              </form>
            </Form>
          </Card>
        </TabsContent>

        {/* Sign Up Tab */}
        <TabsContent value="sign-up">
          <Card>
            <CardHeader>
              <CardTitle>Sign Up</CardTitle>
              <CardDescription>
                Create an account to get started with GiantOracle.
              </CardDescription>
            </CardHeader>
            <Form {...signUpForm}>
              <form onSubmit={signUpForm.handleSubmit(handleSignUp)}>
                <CardContent className="space-y-4">
                  <FormField
                    control={signUpForm.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="pro@giantoracle.com"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={signUpForm.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Password</FormLabel>
                        <FormControl>
                          <Input type="password" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                   {authError && <p className="text-sm font-medium text-destructive">{authError}</p>}
                </CardContent>
                <CardFooter>
                  <Button type="submit" className="w-full" disabled={loading}>
                     {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Sign Up
                  </Button>
                </CardFooter>
              </form>
            </Form>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}


export default function AuthPage() {
    return (
        <AuthProvider>
            <AuthForm />
        </AuthProvider>
    )
}
