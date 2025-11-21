import { Header } from "@/components/header";

export default function CookiePolicyPage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 pt-20 pb-12 max-w-4xl">
        <h1 className="text-4xl font-bold mb-8">Cookie Policy</h1>

        <div className="prose prose-slate dark:prose-invert max-w-none">
          <p className="text-muted-foreground mb-6">
            Last updated: {new Date().toLocaleDateString()}
          </p>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">1. What Are Cookies</h2>
            <p className="text-muted-foreground mb-4">
              Cookies are small text files that are placed on your computer or
              mobile device when you visit a website. They are widely used to
              make websites work more efficiently and provide information to the
              website owners.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">
              2. How We Use Cookies
            </h2>
            <p className="text-muted-foreground mb-4">
              User Flow Library uses cookies to:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2 mb-4">
              <li>Remember your preferences and settings</li>
              <li>Keep you signed in</li>
              <li>Understand how you use our Service</li>
              <li>Improve and optimize our Service</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">
              3. Types of Cookies We Use
            </h2>

            <div className="mb-6">
              <h3 className="text-xl font-semibold mb-3">Essential Cookies</h3>
              <p className="text-muted-foreground mb-4">
                These cookies are necessary for the Service to function. They
                include authentication cookies that keep you logged in.
              </p>
            </div>

            <div className="mb-6">
              <h3 className="text-xl font-semibold mb-3">Analytics Cookies</h3>
              <p className="text-muted-foreground mb-4">
                We use analytics cookies to understand how visitors interact
                with our Service. This helps us improve the user experience.
              </p>
            </div>

            <div className="mb-6">
              <h3 className="text-xl font-semibold mb-3">Preference Cookies</h3>
              <p className="text-muted-foreground mb-4">
                These cookies remember your preferences, such as theme settings
                and language preferences.
              </p>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">
              4. Third-Party Cookies
            </h2>
            <p className="text-muted-foreground mb-4">
              Some cookies are placed by third-party services that appear on our
              pages. We use third-party services for:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2 mb-4">
              <li>Authentication (Clerk)</li>
              <li>Analytics (Vercel Analytics)</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">5. Managing Cookies</h2>
            <p className="text-muted-foreground mb-4">
              You can control and manage cookies in various ways. Please keep in
              mind that removing or blocking cookies can impact your user
              experience and parts of our Service may no longer be fully
              accessible.
            </p>
            <p className="text-muted-foreground mb-4">
              Most browsers allow you to:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2 mb-4">
              <li>See what cookies you have and delete them individually</li>
              <li>Block third-party cookies</li>
              <li>Block all cookies from specific sites</li>
              <li>Block all cookies</li>
              <li>Delete all cookies when you close your browser</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">
              6. Changes to This Cookie Policy
            </h2>
            <p className="text-muted-foreground mb-4">
              We may update this Cookie Policy from time to time. We will notify
              you of any changes by posting the new Cookie Policy on this page
              and updating the "Last updated" date.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">7. Contact Us</h2>
            <p className="text-muted-foreground mb-4">
              If you have any questions about our use of cookies, please contact
              us at:
            </p>
            <p className="text-muted-foreground">
              Email: privacy@userflowlibrary.com
            </p>
          </section>
        </div>
      </main>
    </div>
  );
}
