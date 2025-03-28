import { supabase } from "@/lib/supabase.server"

interface BitcoinPriceResponse {
  bitcoin: {
    usd: number
  }
}

export async function getCurrentBitcoinPrice() {
  try {
    // Fetch current Bitcoin price from CoinGecko
    const response = await fetch(
      process.env.BITCOIN_API_URL as string
    )

    if (!response.ok) {
      throw new Error(`Failed to fetch Bitcoin price: ${response.statusText}`)
    }

    const data: BitcoinPriceResponse = await response.json()
    return data.bitcoin.usd
  } catch (error) {
    console.error("Error fetching Bitcoin price:", error)
    return null
  }
}
