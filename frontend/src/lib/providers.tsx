"use client"

import { WagmiProvider } from "wagmi"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"

import { config } from "./web3"
import { useState, useEffect } from "react"

export function Providers({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false)
  const [queryClient] = useState(() => new QueryClient())
  useEffect(() => setMounted(true), [])

  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        
          {mounted ? children : <div className="min-h-screen bg-slate-950" />}
        
      </QueryClientProvider>
    </WagmiProvider>
  )
}
