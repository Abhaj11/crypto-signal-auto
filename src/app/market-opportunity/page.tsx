import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { DollarSign, AlertCircle, Users, TrendingUp, Target, ShieldAlert, CheckCircle, Cpu, Globe, Handshake, BrainCircuit, BarChart, Gauge, LineChart } from "lucide-react";

const marketStats = [
  {
    icon: <DollarSign className="h-8 w-8 text-primary" />,
    label: "Market Size (2024)",
    value: "$1.7 Trillion",
  },
  {
    icon: <TrendingUp className="h-8 w-8 text-primary" />,
    label: "Daily Trading Volume",
    value: "$50+ Billion",
  },
  {
    icon: <Users className="h-8 w-8 text-primary" />,
    label: "Global Active Traders",
    value: "420+ Million",
  },
  {
    icon: <BarChart className="h-8 w-8 text-primary" />,
    label: "Projected Annual Growth",
    value: "15-20%",
  },
];

const problemPoints = [
  "78% of retail investors lose significant capital during bubble events.",
  "Lack of institutional-grade analytical tools for the average trader.",
  "Widespread information asymmetry puts retail investors at a disadvantage.",
  "Difficulty in distinguishing hype from genuine market-moving signals.",
];

const solutionImpacts = [
  {
    icon: <Users className="h-8 w-8 text-accent" />,
    label: "Serviceable Addressable Market",
    value: "50+ Million Active Traders",
  },
  {
    icon: <DollarSign className="h-8 w-8 text-accent" />,
    label: "3-Year Revenue Projection",
    value: "$10-50M ARR",
  },
  {
    icon: <Target className="h-8 w-8 text-accent" />,
    label: "Capital Protection",
    value: "Aims to mitigate billions in potential losses during market corrections.",
  },
];

const riskSections = [
    {
        title: "Technical Risks",
        icon: <Cpu className="h-6 w-6 text-primary" />,
        risks: [
            {
                name: "Data Integrity & Latency",
                description: "API rate limits or data inconsistencies impacting real-time analysis.",
                mitigation: "Redundant, multi-source data aggregation with advanced caching and fallback systems."
            },
            {
                name: "Signal Precision",
                description: "False positives or negatives leading to suboptimal user decisions.",
                mitigation: "Rigorous, continuous backtesting, ensemble modeling, and clear confidence scoring."
            },
        ]
    },
    {
        title: "Business & Market Risks",
        icon: <Globe className="h-6 w-6 text-primary" />,
        risks: [
            {
                name: "Regulatory Landscape",
                description: "Evolving global cryptocurrency regulations.",
                mitigation: "Proactive legal compliance framework and continuous regulatory monitoring."
            },
            {
                name: "Market Volatility",
                description: "Prolonged bear markets affecting user acquisition and retention.",
                mitigation: "Tiered subscription models and value propositions for both bull and bear markets."
            }
        ]
    },
]

const competitiveAdvantages = {
    technical: [
        "Multi-Factor Analysis: Fuses price action, on-chain metrics, and sentiment data.",
        "Proprietary Algorithms: Custom-built indicators for superior risk detection.",
        "High-Frequency Processing: Sub-second signal delivery during critical market events.",
        "Systematic Improvement: Our models are continuously refined with new market data."
    ],
    market: [
        "Intuitive Interface: Institutional power, designed for the retail trader.",
        "Actionable Intelligence: We don't just provide data; we provide clear, ranked trading signals.",
        "Educational Focus: Empowering users to understand market dynamics and risk.",
    ],
    partnerships: [
        "Exchange Integrations: Deep integration with major exchanges for seamless execution.",
        "Exclusive Data Feeds: Partnerships with leading data providers for early access to critical metrics."
    ]
}


export default function MarketOpportunityPage() {
  return (
    <div className="space-y-8 p-4 md:p-8">
      <div className="text-center">
        <h1 className="text-4xl font-extrabold tracking-tight lg:text-5xl">The GiantOracle Opportunity</h1>
        <p className="mt-4 max-w-2xl mx-auto text-lg text-muted-foreground">
            Positioned at the intersection of finance, data science, and technology, GiantOracle is built to capitalize on the explosive growth of the digital asset market.
        </p>
      </div>
      
      <Card className="bg-secondary/50">
        <CardHeader>
          <CardTitle>The Market Landscape</CardTitle>
          <CardDescription>
            The cryptocurrency market represents a vast and rapidly expanding financial frontier.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {marketStats.map((stat) => (
            <div key={stat.label} className="flex items-center gap-4 rounded-lg border bg-background p-4 shadow-sm">
              {stat.icon}
              <div>
                <p className="text-sm font-medium text-muted-foreground">{stat.label}</p>
                <p className="text-xl font-bold">{stat.value}</p>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-6 w-6 text-destructive" />
              <span>The Problem</span>
            </CardTitle>
            <CardDescription>
              Key challenges hindering mass adoption and investor success.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-4">
              {problemPoints.map((point, index) => (
                <li key={index} className="flex items-start gap-3">
                  <div className="mt-1.5 h-2.5 w-2.5 rounded-full bg-primary" />
                  <span className="flex-1 text-base">{point}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-6 w-6 text-accent" />
               <span>The Impact</span>
            </CardTitle>
            <CardDescription>
              How GiantOracle addresses market needs and unlocks value.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {solutionImpacts.map((impact) => (
              <div key={impact.label} className="flex items-start gap-4">
                {impact.icon}
                <div>
                  <p className="font-semibold text-lg">{impact.label}</p>
                  <p className="text-base text-muted-foreground">{impact.value}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
            <CardTitle className="text-center text-3xl font-bold">Our Competitive Edge</CardTitle>
            <CardDescription className="text-center max-w-lg mx-auto">
                Our unique combination of proprietary technology, market strategy, and strategic alliances creates a formidable barrier to entry.
            </CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-8 pt-6 lg:grid-cols-3">
            <div className="space-y-4">
                <h3 className="font-semibold text-xl flex items-center gap-2"><BrainCircuit className="h-7 w-7 text-primary" /> Technical Differentiation</h3>
                <ul className="space-y-3 text-base text-muted-foreground">
                    {competitiveAdvantages.technical.map(item => (
                        <li key={item} className="flex items-start gap-3">
                            <CheckCircle className="h-5 w-5 mt-0.5 flex-shrink-0 text-green-500" />
                            <span>{item}</span>
                        </li>
                    ))}
                </ul>
            </div>
            <div className="space-y-4">
                <h3 className="font-semibold text-xl flex items-center gap-2"><Gauge className="h-7 w-7 text-primary" /> Market Positioning</h3>
                 <ul className="space-y-3 text-base text-muted-foreground">
                    {competitiveAdvantages.market.map(item => (
                        <li key={item} className="flex items-start gap-3">
                            <CheckCircle className="h-5 w-5 mt-0.5 flex-shrink-0 text-green-500" />
                            <span>{item}</span>
                        </li>
                    ))}
                </ul>
            </div>
            <div className="space-y-4">
                <h3 className="font-semibold text-xl flex items-center gap-2"><Handshake className="h-7 w-7 text-primary" /> Strategic Alliances</h3>
                 <ul className="space-y-3 text-base text-muted-foreground">
                    {competitiveAdvantages.partnerships.map(item => (
                        <li key={item} className="flex items-start gap-3">
                            <CheckCircle className="h-5 w-5 mt-0.5 flex-shrink-0 text-green-500" />
                            <span>{item}</span>
                        </li>
                    ))}
                </ul>
            </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
            <CardTitle>Risk Analysis & Mitigation</CardTitle>
            <CardDescription>
                A transparent overview of potential challenges and our proactive strategies to address them.
            </CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-8 lg:grid-cols-2">
            {riskSections.map(section => (
                <div key={section.title} className="space-y-4">
                    <h3 className="font-semibold text-xl flex items-center gap-3">{section.icon} {section.title}</h3>
                    <div className="space-y-4">
                        {section.risks.map(risk => (
                            <div key={risk.name} className="p-4 border rounded-lg bg-background">
                                <p className="font-semibold flex items-center gap-2"><ShieldAlert className="h-5 w-5 text-destructive" /> {risk.name}</p>
                                <p className="text-sm text-muted-foreground mt-1"><strong>Risk:</strong> {risk.description}</p>
                                <p className="text-sm text-green-700 dark:text-green-500 mt-2 flex items-start gap-2"><CheckCircle className="h-4 w-4 mt-0.5 flex-shrink-0" /> <span><strong>Mitigation:</strong> {risk.mitigation}</span></p>
                            </div>
                        ))}
                    </div>
                </div>
            ))}
        </CardContent>
      </Card>

    </div>
  );
}
