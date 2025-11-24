
import { NextRequest, NextResponse } from 'next/server';
import { scanMarket, type ScanOptions } from '@/services/market.service';

// #region API Handlers
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const options: ScanOptions = {
      timeframes: searchParams.get('timeframes')?.split(','),
      minVolume: searchParams.has('minVolume') ? parseFloat(searchParams.get('minVolume')!) : undefined,
      topN: searchParams.has('topN') ? parseInt(searchParams.get('topN')!) : undefined,
    };
    
    const result = await scanMarket(options);
    
    if (!result.success) {
      return NextResponse.json(result, { status: 500 });
    }
    return NextResponse.json(result);

  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body: ScanOptions = await request.json();
    
    const result = await scanMarket(body);
    
    if (!result.success) {
      return NextResponse.json(result, { status: 500 });
    }
    return NextResponse.json(result);

  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
// #endregion
