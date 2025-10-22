import { UserProfile } from "@clerk/nextjs";

export default function UserProfilePage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Account Settings</h1>
            <p className="text-muted-foreground">
              Manage your account information and preferences
            </p>
          </div>
          <UserProfile
            appearance={{
              elements: {
                card: "shadow-lg border border-border",
                navbarButton: "hover:bg-muted",
                formButtonPrimary: "bg-primary hover:bg-primary/90",
                formFieldInput: "border border-border",
                footerActionLink: "text-primary hover:text-primary/80",
              },
            }}
          />
        </div>
      </div>
    </div>
  );
}
