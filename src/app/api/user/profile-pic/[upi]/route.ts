import { NextRequest, NextResponse } from 'next/server';
import { verifySession } from '@/lib/auth';
import { db } from '@/lib/db';
import { createCanvas } from 'canvas';
import crypto from 'crypto';
import { getProfilePic, uploadProfilePic } from '@/lib/r2';

export async function GET(
    request: NextRequest, 
    context: { params: Promise<{ upi: string }> }
) {
    try {
        // Verify authentication
        const sessionToken = request.cookies.get('session')?.value;
        if (!sessionToken) {
            return new NextResponse('Not authenticated', { status: 401 });
        }

        const user = await verifySession(sessionToken);
        if (!user) {
            return new NextResponse('Invalid session', { status: 401 });
        }

        // Await params as per Next.js 15+ requirements
        const { upi } = await context.params;
        
        if (!upi) {
            return new NextResponse('UPI is required', { status: 400 });
        }

        // Try to fetch from R2
        const r2Pic = await getProfilePic(upi);
        if (r2Pic) {
            console.log('Serving profile pic from R2:', upi);
            // Generate ETag and Last-Modified from R2 metadata
            const etag = r2Pic.ContentLength ? `"r2-${upi}-${r2Pic.ContentLength}"` : undefined;
            const lastModified = r2Pic.LastModified ? r2Pic.LastModified.toUTCString() : undefined;
            // Check if client has cached version
            const clientEtag = request.headers.get('if-none-match');
            const clientLastModified = request.headers.get('if-modified-since');
            if ((etag && clientEtag === etag) || (lastModified && clientLastModified === lastModified)) {
                return new NextResponse(null, {
                    status: 304,
                    headers: {
                        ...(etag ? { 'ETag': etag } : {}),
                        ...(lastModified ? { 'Last-Modified': lastModified } : {}),
                        'Cache-Control': 'public, max-age=86400, immutable', // 1 day, immutable
                    },
                });
            }
            return new NextResponse(r2Pic.Body, {
                status: 200,
                headers: {
                    'Content-Type': 'image/png',
                    ...(etag ? { 'ETag': etag } : {}),
                    ...(lastModified ? { 'Last-Modified': lastModified } : {}),
                    'Cache-Control': 'public, max-age=86400, immutable', // 1 day, immutable
                },
            });
        }

        // No existing file found, generate initials avatar
        console.log('Generating avatar for UPI:', upi);
        
        const dbUser = await db.user.findUnique({ 
            where: { upi },
            select: { firstName: true, lastName: true, updatedAt: true }
        });
        
        const initials = dbUser 
            ? (dbUser.firstName[0] + (dbUser.lastName?.[0] || '')).toUpperCase()
            : upi.slice(0, 2).toUpperCase();

        console.log('Generated initials:', initials);

        // Generate avatar with more robust canvas setup
        const canvas = createCanvas(256, 256);
        const ctx = canvas.getContext('2d');
        
        // Ensure context is available
        if (!ctx) {
            throw new Error('Failed to get canvas context');
        }
        
        // Background
        ctx.fillStyle = '#002248';
        ctx.fillRect(0, 0, 256, 256);
        
        // Text
        ctx.font = 'bold 120px Arial, sans-serif';
        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(initials, 128, 128);

        console.log('Canvas created, generating buffer...');

        // Generate PNG buffer (most reliable)
        let buffer: Buffer;
        try {
            buffer = canvas.toBuffer('image/png');
            console.log('PNG buffer generated, size:', buffer?.length);
        } catch (error) {
            console.error('Failed to generate PNG buffer:', error);
            throw new Error('Canvas toBuffer failed');
        }

        // Validate buffer
        if (!buffer || buffer.length === 0) {
            console.error('Buffer is empty or undefined');
            throw new Error('Generated buffer is empty');
        }

        // Save as PNG to R2 as a cache
        try {
            await uploadProfilePic(upi, buffer, 'image/png');
            console.log('Initials avatar cached to R2');
        } catch (err) {
            console.error('Failed to cache initials avatar to R2:', err);
        }

        // Generate ETag for generated image
        const contentHash = crypto.createHash('md5').update(buffer).digest('hex');
        const etag = `"generated-${contentHash}"`;
        const lastModified = new Date().toUTCString();

        return new NextResponse(buffer, {
            status: 200,
            headers: {
                'Content-Type': 'image/png',
                'ETag': etag,
                'Last-Modified': lastModified,
                'Cache-Control': 'private, max-age=1, must-revalidate', // 5 minutes
            },
        });

    } catch (error) {
        console.error('Error serving profile picture:', error);
        
        // Return a simple SVG fallback as last resort
        const { upi } = await context.params;
        const dbUser = await db.user.findUnique({ 
            where: { upi },
            select: { firstName: true, lastName: true }
        });
        
        const initials = dbUser 
            ? (dbUser.firstName[0] + (dbUser.lastName?.[0] || '')).toUpperCase()
            : upi.slice(0, 2).toUpperCase();

        const svgFallback = `
            <svg width="256" height="256" xmlns="http://www.w3.org/2000/svg">
                <rect width="256" height="256" fill="#002248"/>
                <text x="128" y="140" text-anchor="middle" fill="white" font-size="120" font-family="Arial, sans-serif" font-weight="bold">${initials}</text>
            </svg>
        `;

        // No caching for error fallback
        return new NextResponse(svgFallback, {
            status: 200,
            headers: {
                'Content-Type': 'image/svg+xml',
                'Cache-Control': 'no-cache, no-store, must-revalidate',
            },
        });
    }
}