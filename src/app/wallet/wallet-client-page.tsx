"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Wallet, DollarSign, Bitcoin, ArrowRightLeft, Clock, Info, ShoppingCart, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useSearchParams, useRouter } from "next/navigation";
import { updateUserSubscription, updateUserBalance } from "@/lib/user-profile";

type TierKey = 'TRADER' | 'PRO' | 'VIP';

const TIER_NAMES: Record<string, string> = {
    TRADER: 'Trader',
    PRO: 'Professional',
    VIP: 'VIP'
};


export default function WalletClientPage() {
    const { user, userProfile, loading: authLoading } = useAuth();
    const { toast } = useToast();
    const searchParams = useSearchParams();
    const router = useRouter();

    const [isProcessingPayment, setIsProcessingPayment] = useState(false);
    const [action, setAction] = useState<string | null>(null);
    const [tier, setTier] = useState<TierKey | null>(null);
    const [price, setPrice] = useState<number | null>(null);
    const [depositAmount, setDepositAmount] = useState("");
    
    const [isCreatingCheckout, setIsCreatingCheckout] = useState(false);


    useEffect(() => {
        const actionParam = searchParams.get('action');
        const tierParam = searchParams.get('tier') as TierKey;
        const priceParam = searchParams.get('price');
        const depositStatus = searchParams.get('deposit');

        if (depositStatus === 'success') {
            toast({
                title: "Deposit Successful!",
                description: "Your funds have been received and your wallet balance will update shortly after confirmation."
            });
            router.replace('/wallet'); // Use replace to remove query params from URL
        }
        if(depositStatus === 'cancelled') {
             toast({
                variant: 'destructive',
                title: "Deposit Cancelled",
                description: "You have cancelled the deposit process."
            });
            router.replace('/wallet');
        }


        if (actionParam === 'subscribe' && tierParam && priceParam) {
            setAction(actionParam);
            setTier(tierParam);
            setPrice(parseFloat(priceParam));
        }
    }, [searchParams, toast, router]);


    const formatCurrency = (value: number | undefined | null): string => {
        if (value === null || typeof value === 'undefined') {
            return '$0.00';
        }
        return `$${value.toFixed(2)}`;
    }

    const handlePayment = async () => {
        if (!user || !userProfile || price === null || !tier) return;

        setIsProcessingPayment(true);
        const currentBalance = userProfile.walletBalance || 0;

        if (currentBalance < price) {
            toast({
                variant: "destructive",
                title: "Payment Failed",
                description: `Insufficient balance. You need ${formatCurrency(price)} but you only have ${formatCurrency(currentBalance)}. Please deposit funds first.`
            });
            setIsProcessingPayment(false);
            return;
        }

        try {
            // We pass a negative amount to deduct from the balance
            await updateUserBalance(user.uid, -price); 
            await updateUserSubscription(user.uid, tier);

            toast({
                title: "Upgrade Successful!",
                description: `You are now on the ${TIER_NAMES[tier]} plan.`,
            });
            router.push('/wallet'); 

        } catch (error: any) {
             toast({
                variant: "destructive",
                title: "An Error Occurred",
                description: error.message || "Failed to process your payment. Please try again."
            });
        } finally {
            setIsProcessingPayment(false);
        }

    }
    
    const handleCreateCheckout = async () => {
        if (!user) {
            toast({ variant: 'destructive', title: 'Not Logged In', description: 'You must be logged in to make a deposit.' });
            return;
        }
        const amount = parseFloat(depositAmount);
        if (isNaN(amount) || amount <= 0) {
            toast({ variant: 'destructive', title: 'Invalid Amount', description: 'Please enter a valid amount to deposit.' });
            return;
        }
        setIsCreatingCheckout(true);
        try {
            const response = await fetch(`/api/checkout`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    amount: amount,
                    userId: user.uid,
                    userName: userProfile?.name || 'GiantOracle User',
                    userEmail: user.email,
                }),
            });
            const data = await response.json();
            if (!response.ok || !data.success) {
                throw new Error(data.error || 'Failed to create checkout session.');
            }
            
            // Redirect user to the Coinbase Commerce checkout page
            window.location.href = data.checkoutUrl;
        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Checkout Creation Failed', description: error.message });
            setIsCreatingCheckout(false);
        }
    };


    return (
        <div className="space-y-6 p-4 md:p-8">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
                        <Wallet className="h-8 w-8 text-primary" />
                        My Wallet
                    </h1>
                    <p className="text-muted-foreground">
                        Manage your balance, deposits, and view transaction history.
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-1 space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Current Balance</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-baseline gap-4">
                                <span className="text-4xl font-bold">{formatCurrency(userProfile?.walletBalance)}</span>
                                <span className="text-muted-foreground">USD</span>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {action === 'subscribe' && tier && price !== null && TIER_NAMES[tier] && (
                    <Card className="lg:col-span-2 border-2 border-primary shadow-lg">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <ShoppingCart className="h-6 w-6" />
                                Confirm Your Subscription
                            </CardTitle>
                            <CardDescription>
                                You are about to upgrade your plan. Please review the details below.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                           <div className="flex justify-between items-center text-lg">
                                <span className="text-muted-foreground">Plan:</span>
                                <span className="font-bold text-primary">{TIER_NAMES[tier]}</span>
                           </div>
                           <div className="flex justify-between items-center text-lg">
                                <span className="text-muted-foreground">Price:</span>
                                <span className="font-bold">{formatCurrency(price)}</span>
                           </div>
                           <div className="flex justify-between items-center text-lg border-t pt-4 mt-4">
                                <span className="text-muted-foreground">Amount to be deducted:</span>
                                <span className="font-bold text-destructive">{formatCurrency(price)}</span>
                           </div>
                        </CardContent>
                        <CardFooter className="flex justify-end gap-4">
                             <Button variant="outline" onClick={() => router.push('/wallet')}>Cancel</Button>
                             <Button onClick={handlePayment} disabled={isProcessingPayment || authLoading}>
                                {isProcessingPayment && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Confirm & Pay {formatCurrency(price)}
                             </Button>
                        </CardFooter>
                    </Card>
                )}
            </div>

            <Tabs defaultValue="deposit">
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="deposit">Deposit Funds</TabsTrigger>
                    <TabsTrigger value="history">Transaction History</TabsTrigger>
                </TabsList>
                
                <TabsContent value="deposit" className="mt-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Deposit Funds via Coinbase Commerce</CardTitle>
                            <CardDescription>
                                To add funds, enter an amount and create a checkout session. You will be redirected to Coinbase to complete the payment.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="flex items-center gap-2">
                                <Input 
                                    type="number" 
                                    placeholder="Amount in USD" 
                                    value={depositAmount} 
                                    onChange={(e) => setDepositAmount(e.target.value)}
                                    disabled={isCreatingCheckout}
                                />
                                <Button onClick={handleCreateCheckout} disabled={isCreatingCheckout || !depositAmount}>
                                    {isCreatingCheckout ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Bitcoin className="mr-2 h-4 w-4"/>}
                                    {isCreatingCheckout ? "Redirecting..." : "Pay with Crypto"}
                                </Button>
                            </div>
                            <div className="text-xs text-muted-foreground p-3 bg-secondary/50 rounded-md border">
                                <Info className="inline-block h-4 w-4 mr-1" />
                                This will open a secure checkout page hosted by Coinbase Commerce. After a successful payment, your balance will be updated upon blockchain confirmation.
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="history" className="mt-6">
                     <Card>
                        <CardHeader>
                            <CardTitle>Transaction History</CardTitle>
                            <CardDescription>
                                A record of all your deposits, withdrawals, and fees.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="flex flex-col items-center justify-center space-y-3 text-center p-8 border rounded-lg">
                                <Clock className="h-8 w-8 text-muted-foreground" />
                                <p className="font-semibold">No Transactions Yet</p>
                                <p className="text-sm text-muted-foreground">
                                    Your recent transactions will appear here once you start trading or depositing funds.
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
