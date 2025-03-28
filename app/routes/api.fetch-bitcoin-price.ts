import { json, type LoaderFunctionArgs } from "@remix-run/node";
import { requireUser } from "@/lib/supabase.server";
import { getCurrentBitcoinPrice } from "@/lib/bitcoin.server";

export async function loader({ request }: LoaderFunctionArgs) {
  try {
    // Get the authenticated user's session
    await requireUser(request);

    // Fetch and store Bitcoin price
    const price = await getCurrentBitcoinPrice();
    return json({ success: true, price });
  } catch (error) {
    console.error("Error in fetch-bitcoin-price loader:", error);
    return json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    );
  }
}
