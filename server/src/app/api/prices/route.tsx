import { NextResponse } from "next/server";

export async function GET() {
  try {
    const url =
      "https://api.coingecko.com/api/v3/simple/price?vs_currencies=usd%2Caud&ids=bitcoin%2Cethereum%2Cusd-coin%2Cnovatti-australian-digital-dollar&include_24hr_change=true";
    const options = {
      method: "GET",
      headers: {
        accept: "application/json",
        "x-cg-demo-api-key": process.env.COINGECKO_API_KEY!,
      },
    };

    const response = await fetch(url, options);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching cryptocurrency prices:", error);
    return NextResponse.json(
      { error: "Failed to fetch cryptocurrency prices" },
      { status: 500 },
    );
  }
}
