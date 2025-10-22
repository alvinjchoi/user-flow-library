// Conditional UserProfile component to prevent build errors
function ConditionalUserProfile() {
  if (process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY) {
    try {
      const { UserProfile } = require("@clerk/nextjs");
      return (
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
      );
    } catch (error) {
      console.warn("UserProfile not available:", error);
    }
  }
  
  // Fallback: show message that Clerk is not configured
  return (
    <div className="text-center py-8">
      <h2 className="text-xl font-semibold mb-2">Authentication Not Configured</h2>
      <p className="text-muted-foreground">
        Please configure Clerk authentication to access user profile settings.
      </p>
    </div>
  );
}

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
          <ConditionalUserProfile />
        </div>
      </div>
    </div>
  );
}
