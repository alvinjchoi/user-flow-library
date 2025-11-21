import { cva, type VariantProps } from "class-variance-authority";
import { CircleCheckBig } from "lucide-react";
import Link from "next/link";
import { ReactNode } from "react";

import { cn } from "@/lib/utils";

import { Button } from "./button";
import { Badge } from "./badge";

const pricingColumnVariants = cva(
  "max-w-container relative flex flex-col gap-6 overflow-hidden rounded-2xl p-8 shadow-xl transition-all duration-300 hover:shadow-2xl hover:scale-[1.02] border",
  {
    variants: {
      variant: {
        default: "glass-1 to-transparent dark:glass-3 border-border/50 bg-card",
        glow: "glass-2 to-trasparent dark:glass-3 border-border/50 bg-card after:content-[''] after:absolute after:-top-[128px] after:left-1/2 after:h-[128px] after:w-[100%] after:max-w-[960px] after:-translate-x-1/2 after:rounded-[50%] dark:after:bg-foreground/30 after:blur-[72px]",
        "glow-brand":
          "glass-3 from-card/100 to-card/100 dark:glass-4 border-primary/50 bg-card shadow-2xl after:content-[''] after:absolute after:-top-[128px] after:left-1/2 after:h-[128px] after:w-[100%] after:max-w-[960px] after:-translate-x-1/2 after:rounded-[50%] after:bg-primary/20 after:blur-[72px] ring-2 ring-primary/20",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export interface PricingColumnProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof pricingColumnVariants> {
  name: string;
  icon?: ReactNode;
  description: string;
  price: number;
  priceNote: string;
  badge?: string;
  cta: {
    variant: "glow" | "default";
    label: string;
    href: string;
  };
  features: string[];
}

export function PricingColumn({
  name,
  icon,
  description,
  price,
  priceNote,
  badge,
  cta,
  features,
  variant,
  className,
  ...props
}: PricingColumnProps) {
  return (
    <div
      className={cn(pricingColumnVariants({ variant, className }))}
      {...props}
    >
      {badge && (
        <div className="absolute top-4 right-4">
          <Badge variant="default" className="bg-primary text-primary-foreground">
            {badge}
          </Badge>
        </div>
      )}
      <hr
        className={cn(
          "via-foreground/60 absolute top-0 left-[10%] h-[1px] w-[80%] border-0 bg-linear-to-r from-transparent to-transparent",
          variant === "glow-brand" && "via-primary",
        )}
      />
      <div className="flex flex-col gap-7">
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2">
            {icon && (
              <div className="text-primary flex items-center">
                {icon}
              </div>
            )}
            <h2 className="text-2xl font-bold tracking-tight">{name}</h2>
          </div>
          <p className="text-muted-foreground text-sm leading-relaxed">
            {description}
          </p>
        </div>
        <div className="flex items-baseline gap-2">
          <div className="flex items-baseline gap-1">
            <span className="text-muted-foreground text-3xl font-semibold">$</span>
            <span className="text-6xl font-bold tracking-tight">{price}</span>
          </div>
          {price > 0 && (
            <div className="flex flex-col">
              <span className="text-sm font-medium text-muted-foreground">/month</span>
            </div>
          )}
        </div>
        {priceNote && (
          <p className="text-xs text-muted-foreground -mt-2">
            {priceNote}
          </p>
        )}
        <Button 
          variant={variant === "glow-brand" ? "default" : cta.variant} 
          size="lg" 
          className={cn(
            "w-full font-semibold",
            variant === "glow-brand" && "bg-primary text-primary-foreground hover:bg-primary/90"
          )}
          asChild
        >
          <Link href={cta.href}>{cta.label}</Link>
        </Button>
        <hr className="border-border/50" />
      </div>
      <div>
        <ul className="flex flex-col gap-3">
          {features.map((feature) => (
            <li key={feature} className="flex items-start gap-3 text-sm">
              <CircleCheckBig className={cn(
                "size-5 shrink-0 mt-0.5",
                variant === "glow-brand" ? "text-primary" : "text-primary"
              )} />
              <span className="text-foreground/90 leading-relaxed">{feature}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export { pricingColumnVariants };
