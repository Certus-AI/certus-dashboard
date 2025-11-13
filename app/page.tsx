import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default function Home() {
  return (
    <div className="min-h-screen flex items-center justify-center p-8">
      <div className="max-w-2xl w-full space-y-8">
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold tracking-tight">
            Certus Operations Dashboard
          </h1>
          <p className="text-xl text-muted-foreground">
            Monitor AI-driven phone interactions across restaurant locations
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Card className="p-6 hover:shadow-lg transition-shadow">
            <h2 className="text-xl font-semibold mb-2">Overview</h2>
            <p className="text-muted-foreground mb-4">
              View KPIs, metrics, and recent call activity
            </p>
            <Button asChild>
              <Link href="/overview">Go to Overview</Link>
            </Button>
          </Card>

          <Card className="p-6 hover:shadow-lg transition-shadow">
            <h2 className="text-xl font-semibold mb-2">Call Logs</h2>
            <p className="text-muted-foreground mb-4">
              Browse and filter call history with transcripts
            </p>
            <Button asChild variant="outline">
              <Link href="/call-logs">View Calls</Link>
            </Button>
          </Card>

          <Card className="p-6 hover:shadow-lg transition-shadow">
            <h2 className="text-xl font-semibold mb-2">Analytics</h2>
            <p className="text-muted-foreground mb-4">
              Charts, trends, and data exports
            </p>
            <Button asChild variant="outline">
              <Link href="/analytics">View Analytics</Link>
            </Button>
          </Card>

          <Card className="p-6 hover:shadow-lg transition-shadow">
            <h2 className="text-xl font-semibold mb-2">Configuration</h2>
            <p className="text-muted-foreground mb-4">
              Manage settings and preferences
            </p>
            <Button asChild variant="outline">
              <Link href="/configuration">Configure</Link>
            </Button>
          </Card>
        </div>
      </div>
    </div>
  );
}