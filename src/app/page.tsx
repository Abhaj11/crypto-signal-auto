// Dummy comment to trigger a new build
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { CheckCircle, ShieldCheck, Zap, Bot, BarChart, Users } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import placeholderImages from "@/lib/placeholder-images.json";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const features = [
  {
    icon: <Zap className="h-10 w-10 text-primary" />,
    title: "Stay Ahead of the Market",
    description: "Our advanced system detects early warning signs of market bubbles, giving you the critical advantage to protect your capital.",
  },
  {
    icon: <BarChart className="h-10 w-10 text-primary" />,
    title: "Get a Clear Market View",
    description: "We process vast amounts of market data, delivering comprehensive and easy-to-understand reports so you can make informed decisions.",
  },
  {
    icon: <Bot className="h-10 w-10 text-primary" />,
    title: "Actionable Trading Signals",
    description: "Receive clear, ranked signals directly on our platform. Execute trades with confidence based on our proprietary analysis.",
  },
];

const testimonials = [
  {
    name: "Alex Johnson",
    title: "Professional Trader",
    avatar: "AJ",
    image: placeholderImages.testimonial1,
    quote: "GiantOracle has changed the way I trade. It helps me avoid major market crashes and make smarter decisions. Truly a professional-grade tool.",
  },
  {
    name: "Sarah Lee",
    title: "Crypto Enthusiast",
    avatar: "SL",
    image: placeholderImages.testimonial2,
    quote: "I used to be intimidated by the crypto market's volatility. With GiantOracle, I feel much more confident in protecting my investments.",
  },
];


export default function HomePage() {
  return (
    <div className="flex flex-col items-center bg-background text-foreground">
      
      {/* Hero Section */}
      <section className="relative w-full h-[70vh] flex items-center justify-center text-center text-white overflow-hidden">
        <div className="absolute inset-0 z-0">
           <Image
                src={placeholderImages.hero.src}
                alt="Abstract cryptocurrency background"
                fill
                priority
                className="object-cover"
                data-ai-hint={placeholderImages.hero.hint}
              />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent"></div>
        </div>
        <div className="relative z-10 container mx-auto px-4 space-y-6">
          <h1 className="text-4xl font-bold tracking-tight md:text-5xl lg:text-6xl text-foreground">
            Protect Your Capital, Conquer The Market
          </h1>
          <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
            GiantOracle is your advanced trading co-pilot. We detect market risks and provide actionable signals to help you make smarter decisions.
          </p>
          <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
            <Button asChild size="lg">
              <Link href="/dashboard">Get Started For Free</Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="bg-background/50 backdrop-blur-sm">
               <Link href="/market-opportunity">Learn More</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="w-full py-20 lg:py-28">
        <div className="container mx-auto px-4">
          <div className="mb-16 text-center">
            <h2 className="text-3xl font-bold tracking-tight">Why Choose GiantOracle?</h2>
            <p className="mt-4 max-w-xl mx-auto text-muted-foreground">The tools you need for intelligent trading in the crypto world.</p>
          </div>
          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            {features.map((feature) => (
              <div key={feature.title} className="flex flex-col items-center text-center p-6">
                <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                    {feature.icon}
                </div>
                <h3 className="mb-2 text-xl font-bold">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
      
       {/* Testimonials Section */}
      <section id="testimonials" className="w-full bg-secondary py-20 lg:py-28">
        <div className="container mx-auto px-4">
            <div className="mb-16 text-center">
                <h2 className="text-3xl font-bold tracking-tight">What Our Users Are Saying</h2>
                <p className="mt-4 max-w-xl mx-auto text-muted-foreground">Read testimonials from some of the thousands of traders who trust us.</p>
            </div>
            <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
                {testimonials.map((testimonial) => (
                    <Card key={testimonial.name} className="p-6 flex flex-col items-center text-center">
                        <Avatar className="h-16 w-16 mb-4">
                            <AvatarImage src={testimonial.image.src} alt={testimonial.name} data-ai-hint={testimonial.image.hint} />
                            <AvatarFallback>{testimonial.avatar}</AvatarFallback>
                        </Avatar>
                        <CardContent className="p-0">
                             <blockquote className="text-lg italic text-foreground">"{testimonial.quote}"</blockquote>
                        </CardContent>
                        <footer className="mt-4">
                            <p className="font-semibold">{testimonial.name}</p>
                            <p className="text-sm text-muted-foreground">{testimonial.title}</p>
                        </footer>
                    </Card>
                ))}
            </div>
        </div>
      </section>


      {/* Call to Action Section */}
      <section className="w-full py-20 lg:py-28">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold tracking-tight">Ready to Revolutionize Your Trading?</h2>
          <p className="mt-4 max-w-xl mx-auto text-muted-foreground">
            Open an account today and start leveraging our proprietary analytics to protect your capital and boost your profits.
          </p>
          <Button asChild size="lg" className="mt-8">
            <Link href="/dashboard">Open an Account Now</Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
