'use server';

import { NextRequest, NextResponse } from 'next/server';
import coinbase from 'coinbase-commerce-node';

const { Client, resources } = coinbase;

export async function POST(request: NextRequest) {
    const coinbaseApiKey = process.env.COINBASE_COMMERCE_API_KEY;

    if (!coinbaseApiKey) {
        console.error("CRITICAL: COINBASE_COMMERCE_API_KEY is not set. Checkout cannot proceed.");
        return NextResponse.json({ 
            success: false, 
            error: 'Payment gateway is not configured on the server. Please contact support.' 
        }, { status: 503 });
    }

    try {
        // Initialize the client on every request within the handler
        Client.init(coinbaseApiKey);
        const { Charge } = resources;

        const body = await request.json();
        const { amount, userId, userName, userEmail } = body;

        if (!amount || !userId || typeof amount !== 'number' || amount <= 0) {
            return NextResponse.json({ success: false, error: 'A valid numeric amount and User ID are required.' }, { status: 400 });
        }

        const chargeData = {
            name: 'GiantOracle Wallet Deposit',
            description: `Funding wallet for user ${userId}`,
            local_price: {
                amount: amount.toFixed(2),
                currency: 'USD',
            },
            pricing_type: 'fixed_price' as const,
            metadata: {
                userId: userId,
            },
            redirect_url: `${process.env.NEXT_PUBLIC_APP_URL}/wallet?deposit=success`,
            cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/wallet?deposit=cancelled`,
        };
        
        const charge = await Charge.create(chargeData);

        return NextResponse.json({ success: true, checkoutUrl: charge.hosted_url });

    } catch (error: any) {
        console.error("Coinbase charge creation failed:", error);
        
        let errorMessage = "Failed to create a checkout session.";
        // The coinbase-commerce-node library often throws plain errors with a response object
        if (error.response && error.response.data && error.response.data.error) {
            errorMessage = `Coinbase API Error: ${error.response.data.error.message}`;
        } else if (error.message) {
            // Handle cases where the error is from the library itself (e.g., API key invalid)
            errorMessage = `Coinbase API Error: ${error.message}`;
        }

        return NextResponse.json({ 
            success: false, 
            error: errorMessage
        }, { status: 500 });
    }
}
