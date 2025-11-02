import { OrganizationProfile } from "@clerk/nextjs";

export default function OrganizationPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <OrganizationProfile
        appearance={{
          elements: {
            rootBox: "w-full max-w-4xl",
            card: "shadow-lg border border-border",
            navbar: "bg-muted",
          },
        }}
      />
    </div>
  );
}

