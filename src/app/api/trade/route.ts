
import { NextRequest, NextResponse } from 'next/server';
import * as crypto from 'crypto';

const BINANCE_API_URL = 'https://api.binance.com';

// Function to create a signed HMAC-SHA256 signature for Binance API
function createSignature(queryString: string, apiSecret: string): string {
    return crypto.createHmac('sha256', apiSecret).update(queryString).digest('hex');
}


export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { apiKey, apiSecret, symbol, side, quantity, type = 'MARKET' } = body;

        if (!apiKey || !apiSecret || !symbol || !side || !quantity) {
            return NextResponse.json({ success: false, error: 'Missing required trade parameters: apiKey, apiSecret, symbol, side, quantity.' }, { status: 400 });
        }
        
        let queryString = `symbol=${symbol}&side=${side}&type=${type}&quantity=${quantity}&timestamp=${Date.now()}`;
        
        const signature = createSignature(queryString, apiSecret);
        queryString += `&signature=${signature}`;
        
        const url = `${BINANCE_API_URL}/api/v3/order?${queryString}`;

        const tradeResponse = await fetch(url, {
            method: 'POST',
            headers: {
                'X-MBX-APIKEY': apiKey,
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        });

        const responseData = await tradeResponse.json();

        if (!tradeResponse.ok) {
            console.error(`Binance API Error: ${JSON.stringify(responseData)}`);
            throw new Error(`Binance Error: ${responseData.msg || 'Failed to execute trade.'} (Code: ${responseData.code})`);
        }

        // For MARKET orders, Binance returns fills. We calculate avg price.
        let avgPrice = 0;
        let totalQty = 0;
        if(responseData.fills && responseData.fills.length > 0) {
            let totalCost = 0;
            for (const fill of responseData.fills) {
                totalCost += parseFloat(fill.price) * parseFloat(fill.qty);
                totalQty += parseFloat(fill.qty);
            }
            avgPrice = totalCost / totalQty;
        } else {
             // Fallback if fills array is not available
            avgPrice = parseFloat(responseData.price) || 0;
            totalQty = parseFloat(responseData.executedQty)
        }

        const successData = {
            symbol: responseData.symbol,
            orderId: responseData.orderId,
            status: responseData.status,
            side: responseData.side,
            price: avgPrice,
            executedQty: totalQty
        };

        return NextResponse.json({ success: true, data: successData });

    } catch (error: any) {
        console.error('❌ Error in /api/trade:', error);
        return NextResponse.json({
            success: false,
            error: error.message || 'An unknown server error occurred during trade execution.'
        }, { status: 500 });
    }
}
