import { NextRequest, NextResponse } from "next/server";

const allowedOrigins = ["http://localhost:3000", "https://commbank.eth.limo"];

function getCorsHeaders(origin: string | null) {
  const isAllowedOrigin = origin && allowedOrigins.includes(origin);

  return {
    "Access-Control-Allow-Origin": isAllowedOrigin ? origin : allowedOrigins[0],
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
  };
}

export async function GET(request: NextRequest) {
  const origin = request.headers.get("origin");
  const corsHeaders = getCorsHeaders(origin);

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

    return NextResponse.json(data, {
      headers: corsHeaders,
    });
  } catch (error) {
    console.error("Error fetching cryptocurrency prices:", error);
    return NextResponse.json(
      { error: "Failed to fetch cryptocurrency prices" },
      {
        status: 500,
        headers: corsHeaders,
      },
    );
  }
}

export async function OPTIONS(request: NextRequest) {
  const origin = request.headers.get("origin");
  const corsHeaders = getCorsHeaders(origin);

  return new Response(null, {
    status: 200,
    headers: corsHeaders,
  });
}
