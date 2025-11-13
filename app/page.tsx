export default function Home() {
  return (
    <div className="flex min-h-screen items-center justify-center p-8">
      <main className="text-center">
        <h1 className="text-4xl font-bold mb-4">
          Certus Operations Dashboard
        </h1>
        <p className="text-muted-foreground text-lg mb-8">
          AI-powered restaurant call analytics
        </p>
        <div className="flex gap-4 justify-center">
          
            href="/overview"
            className="rounded-lg bg-primary text-primary-foreground px-6 py-3 hover:bg-primary/90 transition-colors"
          >
            View Dashboard
          </a>
          
            href="/call-logs"
            className="rounded-lg border border-input px-6 py-3 hover:bg-accent transition-colors"
          >
            Call Logs
          </a>
        </div>
      </main>
    </div>
  )
}
