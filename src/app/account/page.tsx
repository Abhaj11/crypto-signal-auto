"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
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
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, User, Lock, Shield, Mail, Calendar } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useEffect, useState } from "react";

const profileSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters." }),
  email: z.string().email({ message: "Please enter a valid email." }),
});

const passwordSchema = z.object({
    currentPassword: z.string().min(1, { message: "Current password is required." }),
    newPassword: z.string()
      .min(8, { message: "New password must be at least 8 characters." })
      .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, { 
        message: "Password must contain a lowercase letter, an uppercase letter, and a number." 
      }),
    confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
});

export default function AccountPage() {
    const { user, userProfile, updateUserProfileName, updateUserPassword } = useAuth();
    const { toast } = useToast();
    const [isProfileLoading, setIsProfileLoading] = useState(false);
    const [isPasswordLoading, setIsPasswordLoading] = useState(false);
    
    const [lastUpdated, setLastUpdated] = useState<Date | null>(null); 

    const profileForm = useForm<z.infer<typeof profileSchema>>({
        resolver: zodResolver(profileSchema),
        defaultValues: {
            name: "",
            email: "",
        },
    });

    const passwordForm = useForm<z.infer<typeof passwordSchema>>({
        resolver: zodResolver(passwordSchema),
        defaultValues: {
            currentPassword: "",
            newPassword: "",
            confirmPassword: "",
        }
    });

    useEffect(() => {
        if(user && userProfile) {
            profileForm.setValue("email", userProfile.email || "");
            profileForm.setValue("name", userProfile.name || "");
            if (user.metadata.lastSignInTime) {
              setLastUpdated(new Date(user.metadata.lastSignInTime));
            }
        }
    }, [user, userProfile, profileForm]);

    const handleProfileUpdate = async (values: z.infer<typeof profileSchema>) => {
        setIsProfileLoading(true);
        try {
            await updateUserProfileName(values.name);
            setLastUpdated(new Date()); 
            toast({ 
              title: "Profile Updated!", 
              description: "Your profile has been successfully updated.",
              variant: "default"
            });
        } catch (error: any) {
            toast({ 
              title: "Error!", 
              description: error.message || "Failed to update profile. Please try again.",
              variant: "destructive"
            });
        } finally {
            setIsProfileLoading(false);
        }
    }
    
    const handlePasswordChange = async (values: z.infer<typeof passwordSchema>) => {
        setIsPasswordLoading(true);
        try {
            await updateUserPassword(values.currentPassword, values.newPassword);
            toast({ 
              title: "Password Changed!", 
              description: "Your password has been successfully changed.",
              variant: "default"
            });
            passwordForm.reset();
        } catch (error: any) {
            toast({ 
              title: "Error!", 
              description: error.message || "Failed to change password. Please try again.",
              variant: "destructive"
            });
        } finally {
            setIsPasswordLoading(false);
        }
    }

    return (
        <div className="space-y-6 p-6">
            {/* Header Section */}
            <div className="space-y-2">
                <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
                    <User className="h-8 w-8 text-primary" />
                    Account Settings
                </h1>
                <p className="text-muted-foreground">
                    Manage your account settings and set your preferences.
                </p>
                {lastUpdated && (
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        Last updated: {lastUpdated.toLocaleString('en-US')}
                    </p>
                )}
            </div>

            <Separator />

            {/* Account Overview */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Shield className="h-5 w-5" />
                        Account Overview
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="flex flex-col space-y-1">
                            <span className="text-sm font-medium text-muted-foreground">Status</span>
                            <Badge variant="default" className="w-fit">Active</Badge>
                        </div>
                        <div className="flex flex-col space-y-1">
                            <span className="text-sm font-medium text-muted-foreground">Account Type</span>
                            <span className="font-medium">Pro Trader</span>
                        </div>
                        <div className="flex flex-col space-y-1">
                            <span className="text-sm font-medium text-muted-foreground">Email</span>
                            <span className="font-medium">{user?.email || "Unknown"}</span>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Forms Grid */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                {/* Profile Update Form */}
                <Card>
                    <Form {...profileForm}>
                        <form onSubmit={profileForm.handleSubmit(handleProfileUpdate)}>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <User className="h-5 w-5" />
                                    Profile
                                </CardTitle>

                                <CardDescription>
                                    Update your personal information.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <FormField
                                    control={profileForm.control}
                                    name="name"
                                    render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Full Name</FormLabel>
                                        <FormControl>
                                        <Input placeholder="Pro Trader" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                    )}
                                />
                                <FormField
                                    control={profileForm.control}
                                    name="email"
                                    render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="flex items-center gap-1">
                                            <Mail className="h-4 w-4" />
                                            Email
                                        </FormLabel>
                                        <FormControl>
                                        <Input 
                                            type="email" 
                                            placeholder="pro@giantoracle.com" 
                                            disabled 
                                            {...field} 
                                        />
                                        </FormControl>
                                        <FormMessage />
                                        <p className="text-xs text-muted-foreground">
                                            Email cannot be changed for security reasons.
                                        </p>
                                    </FormItem>
                                    )}
                                />
                                <Button type="submit" disabled={isProfileLoading} className="w-full">
                                    {isProfileLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Update Profile
                                </Button>
                            </CardContent>
                        </form>
                    </Form>
                </Card>

                {/* Password Change Form */}
                <Card>
                    <Form {...passwordForm}>
                        <form onSubmit={passwordForm.handleSubmit(handlePasswordChange)}>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Lock className="h-5 w-5" />
                                    Change Password
                                </CardTitle>
                                <CardDescription>
                                    Choose a new password for your account.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <FormField
                                    control={passwordForm.control}
                                    name="currentPassword"
                                    render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Current Password</FormLabel>
                                        <FormControl>
                                        <Input type="password" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                    )}
                                />
                                <FormField
                                    control={passwordForm.control}
                                    name="newPassword"
                                    render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>New Password</FormLabel>
                                        <FormControl>
                                        <Input type="password" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                    )}
                                />
                                <FormField
                                    control={passwordForm.control}
                                    name="confirmPassword"
                                    render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Confirm New Password</FormLabel>
                                        <FormControl>
                                        <Input type="password" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                    )}
                                />
                                <div className="text-xs text-muted-foreground space-y-1">
                                    <p>Password must contain:</p>
                                    <ul className="list-disc list-inside space-y-1 ml-2">
                                        <li>At least 8 characters</li>
                                        <li>A lowercase letter (a-z)</li>
                                        <li>An uppercase letter (A-Z)</li>
                                        <li>At least one number (0-9)</li>
                                    </ul>
                                </div>
                                <Button type="submit" disabled={isPasswordLoading} className="w-full">
                                    {isPasswordLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Change Password
                                </Button>
                            </CardContent>
                        </form>
                    </Form>
                </Card>
            </div>
            
        </div>
    );
}
