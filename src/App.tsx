import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from './assets/vite.svg'
import heroImg from './assets/hero.png'
import './App.css'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { ExternalLink, MessageCircle, Globe } from "lucide-react"

function App() {
  const [count, setCount] = useState(0)

  return (
    <main className="min-h-screen bg-background text-foreground p-8 flex flex-col items-center gap-12 max-w-4xl mx-auto">
      <section id="center" className="flex flex-col items-center text-center gap-8">
        <div className="relative flex items-center justify-center h-48 w-full group">
          <img src={heroImg} className="absolute z-0 opacity-20 group-hover:opacity-40 transition-opacity duration-500" width="300" alt="" />
          <div className="flex gap-8 items-center z-10 animate-in fade-in zoom-in duration-700">
            <img src={reactLogo} className="h-24 w-24 drop-shadow-[0_0_2rem_rgba(97,218,251,0.5)] animate-pulse" alt="React logo" />
            <img src={viteLogo} className="h-24 w-24 drop-shadow-[0_0_2rem_rgba(100,108,255,0.5)]" alt="Vite logo" />
          </div>
        </div>
        
        <div className="space-y-4">
          <h1 className="text-5xl font-extrabold tracking-tight lg:text-6xl bg-linear-to-r from-primary to-muted-foreground bg-clip-text text-transparent">
            Get started
          </h1>
          <p className="text-xl text-muted-foreground">
            Edit <code className="relative rounded bg-muted px-[0.3rem] py-[0.2rem] font-mono text-sm font-semibold">src/App.tsx</code> and save to test <code className="relative rounded bg-muted px-[0.3rem] py-[0.2rem] font-mono text-sm font-semibold">HMR</code>
          </p>
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
              <Globe className="h-5 w-5 text-primary" />
              Documentation
            </CardTitle>
            <CardDescription>Your questions, answered</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <ul className="space-y-3">
              <li>
                <a href="https://vite.dev/" target="_blank" className="flex items-center gap-3 text-sm font-medium hover:text-primary transition-colors group">
                  <img className="h-4 w-4 grayscale group-hover:grayscale-0" src={viteLogo} alt="" />
                  Explore Vite
                  <ExternalLink className="h-3 w-3 ml-auto opacity-50" />
                </a>
              </li>
              <li>
                <a href="https://react.dev/" target="_blank" className="flex items-center gap-3 text-sm font-medium hover:text-primary transition-colors group">
                  <img className="h-4 w-4 grayscale group-hover:grayscale-0" src={reactLogo} alt="" />
                  Learn React
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
            <CardDescription>Join the Vite community</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="grid grid-cols-2 gap-4">
              <a href="https://chat.vite.dev/" target="_blank">
                <Button variant="outline" className="w-full justify-start gap-2 h-9 px-3">
                  <MessageCircle className="h-4 w-4" />
                  Discord
                </Button>
              </a>
              <a href="https://bsky.app/profile/vite.dev" target="_blank">
                <Button variant="outline" className="w-full justify-start gap-2 h-9 px-3">
                  <Globe className="h-4 w-4" />
                  Bluesky
                </Button>
              </a>
            </div>
          </CardContent>
        </Card>
      </section>

      <footer className="text-center text-sm text-muted-foreground pb-8">
        Built with Shadcn UI and Vite
      </footer>
    </main>
  )
}

export default App
