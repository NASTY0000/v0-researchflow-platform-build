import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({
    ok: true,
    message: 'Ingest route is alive',
    timestamp: new Date().toISOString(),
  })
}
