import { useState, useEffect } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from './assets/vite.svg'
import heroImg from './assets/hero.png'
import elysialogo from './assets/elysia.svg'
import './App.css'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { ExternalLink, MessageCircle, Server } from "lucide-react"

function App() {
  const [count, setCount] = useState(0)
  const [backendData, setBackendData] = useState<{ message: string; status: string } | null>(null)

  useEffect(() => {
    const controller = new AbortController();
    fetch('/api/hello', { signal: controller.signal })
      .then(res => res.json())
      .then(data => setBackendData(data))
      .catch(err => {
        if (err.name !== 'AbortError') {
          console.error("Failed to connect to backend:", err);
        }
      });
    return () => controller.abort();
  }, [])

  return (
    <main className="min-h-screen bg-background text-foreground p-8 flex flex-col items-center gap-12 max-w-4xl mx-auto">
      <section id="center" className="flex flex-col items-center text-center gap-8">
        <div className="relative flex items-center justify-center h-48 w-full group">
          <img src={heroImg} className="absolute z-0 opacity-20 group-hover:opacity-40 transition-opacity duration-500" width="300" alt="" />
          <div className="flex gap-8 items-center z-10 animate-in fade-in zoom-in duration-700">
            <img src={reactLogo} className="h-24 w-24 drop-shadow-[0_0_2rem_rgba(97,218,251,0.5)] animate-pulse hover:scale-110 transition-transform" alt="React logo" />
            <img src={elysialogo} className="h-28 w-28 drop-shadow-[0_0_2rem_rgba(255,100,200,0.5)] hover:scale-110 transition-transform" alt="Elysia logo" />
            <img src={viteLogo} className="h-24 w-24 drop-shadow-[0_0_2rem_rgba(100,108,255,0.5)] hover:scale-110 transition-transform" alt="Vite logo" />
          </div>
        </div>
        
        <div className="space-y-4">
          <h1 className="text-5xl font-extrabold tracking-tight lg:text-6xl bg-linear-to-r from-primary to-muted-foreground bg-clip-text text-transparent">
            Elysia + React
          </h1>
          <p className="text-xl text-muted-foreground">
            Backend Connection: {backendData ? (
              <span className="text-green-500 font-bold">{backendData.status} ✅</span>
            ) : (
              <span className="text-yellow-500 font-bold">Connecting... 🔄</span>
            )}
          </p>
          {backendData && (
            <div className="mt-4 p-4 rounded-lg bg-muted/50 border border-primary/20">
              <p className="text-sm font-mono text-primary italic">"{backendData.message}"</p>
            </div>
          )}
        </div>

        <Button 
          size="lg" 
          variant="secondary"
          className="font-bold text-lg px-8 py-6 rounded-full shadow-lg hover:shadow-primary/20 transition-all active:scale-95"
          onClick={() => setCount((count) => count + 1)}
        >
          Count is {count}
        </Button>
      </section>

      <Separator className="w-full max-w-2xl" />

      <section id="next-steps" className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
        <Card className="overflow-hidden border-2 hover:border-primary/50 transition-colors">
          <CardHeader className="bg-muted/30">
            <CardTitle className="flex items-center gap-2">
              <Server className="h-5 w-5 text-primary" />
              Elysia Backend
            </CardTitle>
            <CardDescription>Directly connected via Bun</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground mb-4">
              Your backend is running in the same process as your dev server, thanks to Bun's unified architecture.
            </p>
            <ul className="space-y-3">
              <li>
                <a href="/api/hello" target="_blank" className="flex items-center gap-3 text-sm font-medium hover:text-primary transition-colors group">
                  <div className="h-4 w-4 rounded bg-primary flex items-center justify-center text-[10px] text-primary-foreground font-bold">G</div>
                  Test GET /api/hello
                  <ExternalLink className="h-3 w-3 ml-auto opacity-50" />
                </a>
              </li>
            </ul>
          </CardContent>
        </Card>

        <Card className="overflow-hidden border-2 hover:border-primary/50 transition-colors">
          <CardHeader className="bg-muted/30">
            <CardTitle className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5 text-primary" />
              Connect with us
            </CardTitle>
            <CardDescription>Join the community</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="grid grid-cols-2 gap-4">
              <a href="https://elysiajs.com/" target="_blank">
                <Button variant="outline" className="w-full justify-start gap-2 h-9 px-3 text-xs">
                  Elysia Docs
                </Button>
              </a>
              <a href="https://bun.sh/" target="_blank">
                <Button variant="outline" className="w-full justify-start gap-2 h-9 px-3 text-xs">
                  Bun Docs
                </Button>
              </a>
            </div>
          </CardContent>
        </Card>
      </section>

      <footer className="text-center text-sm text-muted-foreground pb-8">
        Built with Elysia, Bun, React, and Shadcn UI
      </footer>
    </main>
  )
}

export default App
