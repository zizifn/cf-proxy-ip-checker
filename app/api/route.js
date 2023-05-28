import { NextResponse } from 'next/server';
 
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const address = searchParams.get('address');
  const res = await fetch(`https://${address}`, {
    headers: {
      'Content-Type': 'application/json',
      'API-Key': process.env.DATA_API_KEY,
    },
  });
  const result = await res.text();
 
  return new NextResponse(result,
  {
    status: 200
  })
}