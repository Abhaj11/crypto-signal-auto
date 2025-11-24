
import { NextRequest, NextResponse } from 'next/server';
import { collection, query, where, getDocs, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";

// Define the shape of a Trade document
interface Trade {
    id: string;
    userId: string;
    symbol: string;
    action: 'BUY' | 'SELL';
    entryPrice: number;
    quantity: number;
    status: 'open' | 'closed_tp' | 'closed_sl' | 'closed_manual';
    openedAt: { seconds: number; nanoseconds: number; } | Date; // Firestore timestamp or Date
    pnl?: number;
    closingPrice?: number;
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { userId } = body;

        if (!userId) {
            return NextResponse.json({ success: false, error: 'User ID is required.' }, { status: 400 });
        }

        // Query the 'trades' collection for documents matching the userId
        const tradesCollectionRef = collection(db, "trades");
        const q = query(
            tradesCollectionRef, 
            where("userId", "==", userId),
            orderBy("openedAt", "desc") // Sort by most recent first
        );
        
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
            return NextResponse.json({ success: true, trades: [] });
        }

        const trades: any[] = [];
        querySnapshot.forEach(doc => {
            const data = doc.data();
            // Convert Firestore timestamp to a serializable format (ISO string)
            let openedAt: Date;
            if (data.openedAt && typeof data.openedAt.toDate === 'function') {
                openedAt = data.openedAt.toDate();
            } else if (data.openedAt) {
                // Handle cases where it might already be a different format (less likely)
                openedAt = new Date(data.openedAt);
            } else {
                openedAt = new Date(); // Fallback
            }

            trades.push({
                id: doc.id,
                ...data,
                openedAt: openedAt.toISOString(), // Convert to string for JSON
            });
        });

        return NextResponse.json({ success: true, trades: trades });

    } catch (error: any) {
        console.error("❌ Error fetching trade history:", error);
        return NextResponse.json({
            success: false,
            error: error.message || "An unknown server error occurred while fetching trade history."
        }, { status: 500 });
    }
}

export async function GET(request: NextRequest) {
  // This is a fallback for simple tests, though the app uses POST.
  return NextResponse.json({ success: true, message: "Please use POST to fetch trade history with a userId." });
}
