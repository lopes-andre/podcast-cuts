export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">Podcast Highlighter</h1>
        <p className="text-muted-foreground text-lg mb-8">
          AI-powered podcast highlight extraction tool
        </p>
        <div className="flex gap-4 justify-center">
          <a
            href="/episodes"
            className="px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity"
          >
            View Episodes
          </a>
          <a
            href="/highlights"
            className="px-6 py-3 bg-secondary text-secondary-foreground rounded-lg hover:opacity-90 transition-opacity"
          >
            View Highlights
          </a>
        </div>
      </div>
    </main>
  );
}

