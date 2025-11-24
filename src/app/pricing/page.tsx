
"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Check, Rocket, Gem, Star } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useRouter } from "next/navigation";

type TierName = 'Trader' | 'Professional' | 'VIP';
type TierKey = 'TRADER' | 'PRO' | 'VIP';

const tiers = [
  {
    name: "Trader" as TierName,
    key: "TRADER" as TierKey,
    price: 29,
    priceDisplay: "$29/month",
    description: "For the active retail trader who wants a powerful market edge.",
    features: [
        "Access to Silver+ Signals",
        "Manual Trade Execution via API",
        "Advanced Charting & AI Analysis",
        "Standard Email Support",
        "30% Profit Share on Auto-Trades",
    ],
    buttonText: "Select Trader Plan",
    icon: <Rocket className="h-8 w-8 text-primary" />,
  },
  {
    name: "Professional" as TierName,
    key: "PRO" as TierKey,
    price: 79,
    priceDisplay: "$79/month",
    description: "For serious traders requiring faster, more powerful tools.",
    features: [
      "Includes all Trader features",
      "Access to Gold+ Signals",
      "Priority Signal Delivery",
      "Auto-Trading on Gold+ Signals",
      "15% Profit Share on Auto-Trades",
    ],
    buttonText: "Select Professional Plan",
    icon: <Star className="h-8 w-8 text-yellow-500" />,
    highlight: true,
  },
  {
    name: "VIP" as TierName,
    key: "VIP" as TierKey,
    price: 149,
    priceDisplay: "$149/month",
    description: "For elite traders who demand the absolute best performance.",
    features: [
      "Includes all Professional features",
      "Access to Platinum Signals",
      "Fully-Automated Trading Bot",
      "Advanced Risk Management Engine",
      "10% (Lowest) Profit Share",
      "Dedicated 24/7 Support",
    ],
    buttonText: "Select VIP Plan",
    icon: <Gem className="h-8 w-8 text-purple-500" />,
  },
];

const acceptedCryptos = [
  "Bitcoin (BTC)", "Ethereum (ETH)", "USDT (Tether)",
  "USDC (USD Coin)", "BNB (Binance Coin)", "Solana (SOL)",
  "Cardano (ADA)", "Polkadot (DOT)"
];

export default function PricingPage() {
    const { user, userProfile, loading } = useAuth();
    const router = useRouter();

    const handleSubscriptionChange = (tier: TierKey, price: number) => {
        if (!user) {
            router.push('/auth');
            return;
        }
        router.push(`/wallet?action=subscribe&tier=${tier}&price=${price}`);
    };

    const currentTier = userProfile?.subscriptionTier || 'FREE';

  return (
    <div className="space-y-12 p-4 md:p-8">
      <div className="text-center">
        <h1 className="text-4xl font-bold tracking-tight">Simple, Powerful Pricing</h1>
        <p className="mt-2 text-lg text-muted-foreground">
          Choose the plan that fits your strategy. Cancel or upgrade anytime.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-8 md:grid-cols-3 max-w-6xl mx-auto items-start">
        {tiers.map((tier) => {
          const isCurrentPlan = currentTier === tier.key;
          return (
            <Card key={tier.name} className={`flex flex-col border-2 transition-all ${isCurrentPlan || tier.highlight ? 'border-primary shadow-lg' : 'hover:border-primary/50'}`}>
              <CardHeader className="items-center">
                {tier.icon}
                <CardTitle className="mt-4">{tier.name}</CardTitle>
                <CardDescription className="text-center h-16">{tier.priceDisplay}<br />{tier.description}</CardDescription>
              </CardHeader>
              <CardContent className="flex-grow">
                <ul className="space-y-3">
                  {tier.features.map((feature) => (
                    <li key={feature} className="flex items-start">
                      <Check className="mr-2 mt-1 h-4 w-4 flex-shrink-0 text-green-500" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter>
                <Button 
                    className="w-full"
                    onClick={() => handleSubscriptionChange(tier.key, tier.price)}
                    disabled={isCurrentPlan || loading}
                    variant={tier.highlight ? "default" : "outline"}
                >
                    {isCurrentPlan ? "Your Current Plan" : tier.buttonText}
                </Button>
              </CardFooter>
            </Card>
          )
        })}
      </div>

      <div className="grid grid-cols-1 gap-8 md:grid-cols-2 max-w-4xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>Pay with Crypto</CardTitle>
            <CardDescription>
              We embrace decentralization. Pay for your subscription using your favorite cryptocurrency.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="mb-4 font-semibold">Accepted Cryptocurrencies:</p>
            <div className="grid grid-cols-2 gap-2 text-sm">
                {acceptedCryptos.map((crypto) => (
                    <div key={crypto} className="flex items-center">
                        <svg viewBox="0 0 8 8" className="h-2 w-2 mr-2 text-primary fill-current"><circle cx="4" cy="4" r="4"/></svg>
                        <span>{crypto}</span>
                    </div>
                ))}
            </div>
             <p className="text-xs text-muted-foreground mt-4">All payments are processed securely via Coinbase Commerce.</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Profit Sharing Model</CardTitle>
            <CardDescription>
              Our auto-trading bot operates on a performance-based fee structure. We only win when you win.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <p>A small percentage of the profit from each successful, automated trade is deducted from your wallet. This fee varies by your subscription tier:</p>
            <ul className="list-disc list-inside text-muted-foreground">
                <li><span className="font-semibold text-foreground">VIP:</span> 10% Profit Share</li>
                <li><span className="font-semibold text-foreground">Professional:</span> 15% Profit Share</li>
                <li><span className="font-semibold text-foreground">Trader:</span> 30% Profit Share</li>
            </ul>
             <p className="text-xs text-muted-foreground pt-2 border-t">There are no fees for losing trades or manual trades. This model ensures our interests are aligned with yours.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
