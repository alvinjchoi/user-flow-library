"use client";

import { useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowRight,
  Layers,
  Users,
  Share2,
  Check,
  Star,
  Mail,
  Twitter,
  Linkedin,
  Github,
  Play,
  Search,
} from "lucide-react";
import { SignedIn, SignedOut } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { LandingNavbar } from "@/components/landing-navbar";
import Footer from "@/components/shadcn-studio/blocks/footer-component-01/footer-component-01";

export default function LandingPage() {
  useEffect(() => {
    document.title = "User Flow Library | Organize Your User Flows";
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <LandingNavbar />

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 md:py-32">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div>
            {/* Title */}
            <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              Organize Your User Flows
            </h1>

            {/* Description */}
            <p className="text-xl text-muted-foreground mb-8">
              A beautiful, collaborative tool for organizing user flows and
              managing UI screenshots. Perfect for designers, product managers,
              and development teams.
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-4 mb-8 lg:mb-0">
              <Button size="lg" asChild>
                <Link href="/sign-up">
                  Get Started Free
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              {/* <Button size="lg" variant="outline" asChild>
                <Link href="#how-it-works">
                  <Play className="mr-2 h-5 w-5" />
                  See How It Works
                </Link>
              </Button> */}
            </div>
          </div>

          {/* Product Screenshot */}
          <div className="relative mt-8 lg:mt-0">
            <div className="rounded-lg border bg-muted overflow-hidden shadow-2xl">
              <Image
                src="/app-screenshot.png"
                alt="User Flow Library - Organize your user flows and screens"
                width={1200}
                height={800}
                className="w-full h-auto"
                priority
              />
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section id="benefits" className="container mx-auto px-4 py-20">
        <h2 className="text-3xl font-bold text-center mb-12">Benefits</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            {
              title: "Save Time",
              description:
                "Organize your user flows in minutes instead of hours. No more scattered screenshots and confusing documentation.",
            },
            {
              title: "Better Collaboration",
              description:
                "Work seamlessly with your team. Comment, review, and iterate together in real-time.",
            },
            {
              title: "Client Presentations",
              description:
                "Share beautiful, organized flows with clients. Impress them with professional presentations.",
            },
            {
              title: "Version Control",
              description:
                "Track changes and maintain history of your user flows. Never lose important iterations.",
            },
            {
              title: "Export Options",
              description:
                "Export your flows as PDFs, images, or share via public links. Perfect for documentation.",
            },
            {
              title: "Smart Organization",
              description:
                "Hierarchical structure lets you organize complex flows with parent-child relationships.",
            },
          ].map((benefit, i) => (
            <Card key={i} className="h-full">
              <CardHeader>
                <CardTitle>{benefit.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>{benefit.description}</CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* How It Works Section */}
      <section
        id="how-it-works"
        className="container mx-auto px-4 py-20 bg-muted/30"
      >
        <h2 className="text-3xl font-bold text-center mb-12">How it works?</h2>
        <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
          {[
            {
              step: "1",
              title: "Create Your Project",
              description:
                "Sign up for free and create your first project. Give it a name and choose your platform type.",
            },
            {
              step: "2",
              title: "Add Flows & Screens",
              description:
                "Organize your user flows hierarchically. Upload screenshots and arrange them in logical flows.",
            },
            {
              step: "3",
              title: "Collaborate & Share",
              description:
                "Invite your team, add comments, and share with clients. Export or share via public links.",
            },
          ].map((item) => (
            <Card key={item.step} className="text-center">
              <CardHeader>
                <div className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center mx-auto mb-4 text-xl font-bold">
                  {item.step}
                </div>
                <CardTitle>{item.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>{item.description}</CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="container mx-auto px-4 py-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">Pricing</h2>
          <p className="text-lg text-muted-foreground">
            Choose the plan that works best for your team
          </p>
        </div>
        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* Starter Plan */}
          <Card className="border-primary border-2">
            <CardHeader className="pt-6">
              <CardTitle>Starter</CardTitle>
              <div className="text-3xl font-bold mt-4">$0</div>
              <CardDescription>/month</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button className="w-full" variant="outline" asChild>
                <Link href="/sign-up">Get Started</Link>
              </Button>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-primary" />
                  Up to 1 user
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-primary" />
                  Up to 3 projects
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-primary" />
                  Basic organization
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-primary" />
                  Public sharing
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-primary" />
                  Community support
                </li>
              </ul>
            </CardContent>
          </Card>

          {/* Basic Plan - Highlighted */}
          <Card className="border-primary border-2 relative">
            <CardHeader className="pt-6">
              <div className="flex items-center gap-2">
                <CardTitle>Basic</CardTitle>
                <Badge>Most Popular</Badge>
              </div>
              <div className="text-3xl font-bold mt-4">$29</div>
              <CardDescription>/month</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button className="w-full" asChild>
                <Link href="/checkout?plan=basic">Get Started</Link>
              </Button>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-primary" />
                  Unlimited users
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-primary" />
                  Everything in Starter
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-primary" />
                  Unlimited projects
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-primary" />
                  Team collaboration
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-primary" />
                  Advanced organization
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-primary" />
                  Priority support
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-primary" />
                  PDF export
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Testimonials Section */}
      <section
        id="testimonials"
        className="container mx-auto px-4 py-20 bg-muted/30"
      >
        <h2 className="text-3xl font-bold text-center mb-12">
          Loved by people worldwide
        </h2>
        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {[
            {
              name: "Sarah Chen",
              role: "Product Designer",
              company: "TechCorp",
              rating: 5,
              text: "This tool has completely transformed how we organize our user flows. The collaboration features are amazing!",
            },
            {
              name: "Michael Rodriguez",
              role: "Product Manager",
              company: "StartupXYZ",
              rating: 5,
              text: "Finally, a tool that makes sense for product teams. Easy to use, beautiful, and incredibly powerful.",
            },
            {
              name: "Emily Johnson",
              role: "UX Designer",
              company: "DesignStudio",
              rating: 5,
              text: "The hierarchical organization is exactly what we needed. Our client presentations have never looked better!",
            },
          ].map((testimonial, i) => (
            <Card key={i}>
              <CardHeader>
                <div className="flex items-center gap-1 mb-2">
                  {Array.from({ length: testimonial.rating }).map((_, j) => (
                    <Star
                      key={j}
                      className="w-4 h-4 fill-yellow-400 text-yellow-400"
                    />
                  ))}
                </div>
                <CardDescription>{testimonial.text}</CardDescription>
              </CardHeader>
              <CardContent>
                <div>
                  <p className="font-semibold">{testimonial.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {testimonial.role} at {testimonial.company}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="container mx-auto px-4 py-20">
        <h2 className="text-3xl font-bold text-center mb-12">
          Frequently Asked Questions
        </h2>
        <div className="max-w-3xl mx-auto">
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="item-1">
              <AccordionTrigger>
                Can I cancel my subscription anytime?
              </AccordionTrigger>
              <AccordionContent>
                Yes, you can cancel your subscription at any time. There are no
                long-term contracts or cancellation fees. Your access will
                continue until the end of your current billing period.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-2">
              <AccordionTrigger>Do you offer refunds?</AccordionTrigger>
              <AccordionContent>
                We offer a 30-day money-back guarantee for all paid plans. If
                you're not satisfied with our service, contact us within 30 days
                of your purchase for a full refund.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-3">
              <AccordionTrigger>
                What happens to my data if I cancel?
              </AccordionTrigger>
              <AccordionContent>
                Your data remains accessible for 90 days after cancellation. You
                can export all your projects, flows, and screens during this
                period. After 90 days, your data will be permanently deleted.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-4">
              <AccordionTrigger>
                Can I upgrade or downgrade my plan?
              </AccordionTrigger>
              <AccordionContent>
                Yes, you can change your plan at any time. Upgrades take effect
                immediately, while downgrades take effect at the end of your
                current billing period. We'll prorate any charges accordingly.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-20">
        <Card className="bg-primary text-primary-foreground border-none">
          <CardContent className="py-16 text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Ready to organize your user flows?
            </h2>
            <p className="text-xl mb-8 opacity-90">
              Join thousands of teams already using User Flow Library
            </p>
            <Button size="lg" variant="secondary" asChild>
              <Link href="/sign-up">
                Get Started Free
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </section>

      {/* Footer */}
      <Footer />
    </div>
  );
}
