import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getSessionCookie } from "better-auth/cookies";

export async function proxy(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // Memproteksi kerangka dashboard page
    if (pathname.startsWith("/dashboard")) {
        const sessionCookie = getSessionCookie(request);
        
        if (!sessionCookie) {
            // Redirect pengguna tak dikenal kembali ke halaman awal (login)
            return NextResponse.redirect(new URL("/", request.url));
        }
    }
    
    return NextResponse.next();
}

export const config = {
    matcher: ["/dashboard/:path*"],
};
