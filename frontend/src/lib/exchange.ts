export async function getUSDtoBRL(): Promise<number> {
  try {
    const res = await fetch('https://api.exchangerate-api.com/v4/latest/USD')
    const data = await res.json()
    return data.rates.BRL as number
  } catch {
    return 5.75
  }
}

export async function getETHPrice(): Promise<number> {
  try {
    const res = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd')
    const data = await res.json()
    return data.ethereum.usd as number
  } catch {
    return 2300
  }
}

export function calcPrices(valorBRL: number, fracoes: number, usdBRL: number, ethUSD: number) {
  const totalUSD = valorBRL / usdBRL
  const totalETH = totalUSD / ethUSD
  const fracaoUSDC = totalUSD / fracoes
  const fracaoETH = totalETH / fracoes
  return {
    totalUSDC: totalUSD.toFixed(2),
    totalETH: totalETH.toFixed(4),
    fracaoUSDC: fracaoUSDC.toFixed(2),
    fracaoETH: fracaoETH.toFixed(6),
  }
}
