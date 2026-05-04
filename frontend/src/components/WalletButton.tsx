"use client"
import { useAccount, useConnect, useDisconnect } from "wagmi"
import { metaMask } from "wagmi/connectors"

export function WalletButton() {
  const { address, isConnected } = useAccount()
  const { connect } = useConnect()
  const { disconnect } = useDisconnect()

  if (isConnected) {
    return (
      <button
        onClick={() => disconnect()}
        className="px-4 py-2 bg-slate-800 border border-slate-700 text-slate-300 rounded-xl text-sm font-semibold hover:bg-slate-700 transition-all"
      >
        {address?.slice(0, 6)}...{address?.slice(-4)}
      </button>
    )
  }

  return (
    <button
      onClick={() => connect({ connector: metaMask() })}
      className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-500 transition-all"
    >
      Connect Wallet
    </button>
  )
}
