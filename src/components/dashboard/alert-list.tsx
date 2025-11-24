"use client";
import { Bell, AlertTriangle, ShieldAlert, ShieldCheck, Info, Loader2, Search } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useState, useEffect } from "react";

interface Opportunity {
  rank: 'PLATINUM' | 'GOLD' | 'SILVER' | 'WATCH';
  symbol: string;
  tradingSignal: string;
}


const getAlertDetails = (opportunity: Opportunity) => {
    switch (opportunity.rank) {
        case 'PLATINUM':
            return {
                risk: "Critical",
                icon: <ShieldAlert className="h-5 w-5 text-destructive" />,
                title: `${opportunity.rank} Signal: ${opportunity.symbol}`,
                badgeClass: "bg-purple-600 hover:bg-purple-700 text-white",
            };
        case 'GOLD':
             return {
                risk: "High",
                icon: <AlertTriangle className="h-5 w-5 text-orange-400" />,
                title: `${opportunity.rank} Signal: ${opportunity.symbol}`,
                badgeClass: "bg-yellow-500 hover:bg-yellow-600 text-black",
            };
        case 'SILVER':
            return {
                risk: "Medium",
                icon: <Bell className="h-5 w-5 text-yellow-500" />,
                title: `${opportunity.rank} Signal: ${opportunity.symbol}`,
                badgeClass: "bg-gray-400 hover:bg-gray-500 text-white",
            };
        case 'WATCH':
             return {
                risk: "Info",
                icon: <Info className="h-5 w-5 text-blue-500" />,
                title: `${opportunity.rank} List: ${opportunity.symbol}`,
                badgeClass: "bg-blue-500/20 text-blue-500",
            };
        default:
            return {
                risk: "Info",
                icon: <Info className="h-5 w-5 text-muted-foreground" />,
                title: `Signal: ${opportunity.symbol}`,
                badgeClass: "bg-secondary text-secondary-foreground",
            };
    }
};


export function AlertList() {
  const [alerts, setAlerts] = useState<Opportunity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    const fetchAlerts = async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await fetch(`/api/scan`);
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ error: 'Failed to parse error response' }));
                throw new Error(errorData.error || 'Failed to fetch market scan data');
            }
            const data = await response.json();
            if (data.success) {
                setAlerts(data.opportunities.slice(0, 4)); // Get top 4 opportunities
            } else {
                throw new Error(data.error || 'API returned an error');
            }
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    fetchAlerts();
  }, []);

  const renderContent = () => {
    if (loading) {
        return (
            <div className="flex items-center justify-center p-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="ml-4 text-muted-foreground">Loading Real-time Alerts...</p>
            </div>
        )
    }

    if(error){
        return (
            <div className="text-center p-8 text-destructive">
                <p>Failed to load alerts: {error}</p>
            </div>
        )
    }

    if(alerts.length === 0) {
        return (
            <div className="text-center p-8">
                <Search className="h-8 w-8 mx-auto text-muted-foreground" />
                <p className="mt-4 text-muted-foreground">No high-priority signals found. The market is currently quiet.</p>
            </div>
        )
    }

    return (
         <div className="space-y-4">
          {alerts.map((alert, index) => {
            const details = getAlertDetails(alert);
            return (
              <div key={index} className="flex items-start gap-4">
                <div className="mt-1">{details.icon}</div>
                <div className="flex-1">
                  <p className="font-medium">{details.title}</p>
                  <p className="text-sm text-muted-foreground">
                    {alert.tradingSignal}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <time className="text-xs text-muted-foreground">Just now</time>
                  <Badge variant={"secondary"} className={details.badgeClass}>{details.risk}</Badge>
                </div>
              </div>
            );
          })}
        </div>
    )
  }


  return (
    <Card>
      <CardHeader>
        <CardTitle>Intelligent Alert System</CardTitle>
        <CardDescription>
          Live market opportunities, prioritized by risk from our advanced scanner.
        </CardDescription>
      </CardHeader>
      <CardContent>
       {renderContent()}
      </CardContent>
    </Card>
  );
}
