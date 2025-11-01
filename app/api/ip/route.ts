import { NextResponse } from 'next/server';

// Get the server's public IP addresses
export async function GET() {
  // No authentication required - this is public server info needed by watcher
  try {
    // Fetch IPv4
    const ipv4Response = await fetch('https://api.ipify.org?format=json');
    const ipv4Data = await ipv4Response.json();

    // Fetch IPv6 (may not always be available)
    let ipv6 = null;
    try {
      const ipv6Response = await fetch('https://api64.ipify.org?format=json');
      const ipv6Data = await ipv6Response.json();
      // Only set if it's actually an IPv6 address
      if (ipv6Data.ip && ipv6Data.ip.includes(':')) {
        ipv6 = ipv6Data.ip;
      }
    } catch (error) {
      // IPv6 not available - this is normal for many servers
    }

    return NextResponse.json({
      success: true,
      data: {
        ipv4: ipv4Data.ip,
        ipv6: ipv6,
      },
    });
  } catch (error) {
    console.error('Error fetching IP:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch IP address',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
