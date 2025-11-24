
'use server';

import { NextRequest, NextResponse } from 'next/server';
import { Webhook, Event } from 'coinbase-commerce-node';
import { updateUserBalance } from '@/lib/user-profile';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

const webhookSecret = process.env.COINBASE_COMMERCE_WEBHOOK_SECRET;

if (!webhookSecret) {
    console.error("CRITICAL: COINBASE_COMMERCE_WEBHOOK_SECRET is not set. Webhook will fail.");
}

export async function POST(request: NextRequest): Promise<NextResponse> {
    if (!webhookSecret) {
        return NextResponse.json({ success: false, error: 'Webhook secret is not configured on the server.' }, { status: 500 });
    }

    try {
        const rawBody = await request.text();
        const signature = request.headers.get('x-cc-webhook-signature') || '';

        // Verify the webhook signature to ensure the request is from Coinbase
        const event = Webhook.verifyEventBody(rawBody, signature, webhookSecret) as Event;
        
        // We are interested in successful charge confirmations
        if (event.type === 'charge:confirmed') {
            const charge = event.data;

            // Extract the user ID from the charge's metadata
            const userId = charge.metadata?.userId as string | undefined;

            if (!userId) {
                console.warn(`Webhook received for charge ${charge.id} but no userId was found in metadata.`);
                return NextResponse.json({ success: true, message: 'Webhook received but no user ID in metadata.' });
            }

            // The last payment in the timeline is the most recent one
            const lastPayment = charge.timeline[charge.timeline.length - 1];
            if (lastPayment.status !== 'COMPLETED') {
                 return NextResponse.json({ success: true, message: 'Charge is not yet completed.' });
            }
            
            const amount = parseFloat(lastPayment.value.local.amount);
            const currency = lastPayment.value.local.currency;

            if (currency !== 'USD') {
                 console.warn(`Received payment in ${currency}, not USD. Skipping balance update for user ${userId}.`);
                 return NextResponse.json({ success: true, message: `Payment currency is not USD.` });
            }

            // Update the user's wallet balance in Firestore
            await updateUserBalance(userId, amount);

            console.log(`Successfully updated wallet for user ${userId}. Added ${amount} ${currency}.`);

            return NextResponse.json({ success: true, message: 'Wallet balance updated successfully.' });
        }

        return NextResponse.json({ success: true, message: `Webhook event '${event.type}' received and ignored.` });

    } catch (error: any) {
        console.error('Webhook verification failed or an error occurred:', error);
        return NextResponse.json({ success: false, error: error.message || 'Webhook processing failed.' }, { status: 400 });
    }
}

    