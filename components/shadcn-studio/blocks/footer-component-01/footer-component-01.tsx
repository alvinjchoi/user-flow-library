"use client";

import Link from "next/link";
import { Logo, LogoText } from "@/components/shadcnblocks/logo";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Mail, Search } from "lucide-react";

interface MenuItem {
  title: string;
  links: {
    text: string;
    url: string;
  }[];
}

interface FooterProps {
  logo?: {
    url: string;
    src: string;
    alt: string;
    title: string;
  };
  tagline?: string;
  menuItems?: MenuItem[];
  copyright?: string;
  bottomLinks?: {
    text: string;
    url: string;
  }[];
}

const Footer = ({
  logo = {
    src: "/placeholder-logo.svg",
    alt: "User Flow Library",
    title: "User Flow Library",
    url: "/",
  },
  tagline = "Organize your user flows and collaborate with your team.",
  menuItems = [
    {
      title: "Menu",
      links: [
        { text: "Benefits", url: "#benefits" },
        { text: "How it works", url: "#how-it-works" },
        { text: "Pricing", url: "/pricing" },
        { text: "FAQ", url: "#faq" },
      ],
    },
    {
      title: "Legal",
      links: [
        { text: "Privacy Policy", url: "/privacy-policy" },
        { text: "Terms of Service", url: "/terms-of-service" },
        { text: "Cookie Policy", url: "/cookie-policy" },
      ],
    },
  ],
  copyright = `© ${new Date().getFullYear()} User Flow Library. All rights reserved.`,
  bottomLinks = [],
}: FooterProps) => {
  return (
    <section className="pt-20 border-t border-border bg-muted/50">
      <div className="container mx-auto px-4">
        <footer>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 pb-16">
            <div className="md:col-span-2 lg:col-span-2 mb-8 lg:mb-0 text-left">
              <div className="flex items-center gap-3 justify-start mb-6 pt-4">
                <Logo url={logo.url}>
                  <LogoText className="text-2xl font-bold text-foreground">
                    {logo.title}
                  </LogoText>
                </Logo>
              </div>
              <p className="text-muted-foreground text-base leading-relaxed max-w-md">
                {tagline}
              </p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-2 gap-8 md:col-span-2 lg:col-span-2">
              {menuItems.map((section, sectionIdx) => (
                <div key={sectionIdx}>
                  <h3 className="mb-4 font-bold">{section.title}</h3>
                  {section.title === "Newsletter" ? (
                    <div>
                      <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
                        Stay updated with our latest features and tips.
                      </p>
                      <div className="flex gap-2">
                        <Input
                          type="email"
                          placeholder="Your email"
                          className="flex-1"
                        />
                        <Button size="icon">
                          <Mail className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <ul className="text-muted-foreground space-y-4">
                      {section.links.map((link, linkIdx) => (
                        <li
                          key={linkIdx}
                          className="hover:text-primary font-medium"
                        >
                          <Link href={link.url}>{link.text}</Link>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          </div>
          <div className="text-muted-foreground mt-16 flex flex-col justify-between gap-4 border-t border-border pt-8 pb-8 text-sm font-medium md:flex-row md:items-center">
            <p className="py-4">{copyright}</p>
            {bottomLinks.length > 0 && (
              <ul className="flex gap-4">
                {bottomLinks.map((link, linkIdx) => (
                  <li key={linkIdx} className="hover:text-primary underline">
                    <Link href={link.url}>{link.text}</Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </footer>
      </div>
    </section>
  );
};

export default Footer;
