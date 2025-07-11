import { NextRequest, NextResponse } from 'next/server';
import { verifySession } from '@/lib/auth';
import { hasPermission, PERMISSIONS } from '@/lib/rbac';
import { logDeniedAccess } from '@/lib/auth';
import path from 'path';
import sharp from 'sharp';
import fsPromises from 'fs/promises';
import { uploadProfilePic, deleteProfilePics } from '@/lib/r2';

export async function GET(request: NextRequest) {
    const sessionToken = request.cookies.get('session')?.value;

    if (!sessionToken) {
        return NextResponse.json({ error: 'No session' }, { status: 401 });
    }

    const user = await verifySession(sessionToken);

    if (!user) {
        return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
    }

    // Authorization: user:read
    if (!hasPermission(user.role, PERMISSIONS.USER_READ)) {
        logDeniedAccess({ user, route: '/api/user', reason: 'Missing user:read permission' });
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    return NextResponse.json({ user });
}

export async function POST(request: NextRequest) {
    const sessionToken = request.cookies.get('session')?.value;
    if (!sessionToken) {
        return NextResponse.json({ error: 'No session' }, { status: 401 });
    }
    const user = await verifySession(sessionToken);
    if (!user) {
        return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
    }
    // Authorization: user:update
    if (!hasPermission(user.role, PERMISSIONS.USER_UPDATE)) {
        logDeniedAccess({ user, route: '/api/user', reason: 'Missing user:update permission for profile picture upload' });
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    // Only allow the user to update their own profile picture
    const upi = user.upi;
    const formData = await request.formData();
    const file = formData.get('profilePic');
    if (!file || typeof file === 'string') {
        return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }
    // Delete any existing files for this UPI in R2
    await deleteProfilePics(upi);
    // Convert to PNG and upload to R2
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    // Use sharp to resize and convert to PNG
    const sharp = (await import('sharp')).default;
    const pngBuffer = await sharp(buffer).resize(256, 256).png({ quality: 90 }).toBuffer();
    await uploadProfilePic(upi, pngBuffer, 'image/png');
    return NextResponse.json({ success: true });
}

export async function DELETE(request: NextRequest) {
    const sessionToken = request.cookies.get('session')?.value;
    if (!sessionToken) {
        return NextResponse.json({ error: 'No session' }, { status: 401 });
    }
    const user = await verifySession(sessionToken);
    if (!user) {
        return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
    }
    // Authorization: user:update
    if (!hasPermission(user.role, PERMISSIONS.USER_UPDATE)) {
        logDeniedAccess({ user, route: '/api/user', reason: 'Missing user:update permission for avatar reset' });
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    const upi = user.upi;
    await deleteProfilePics(upi);
    return NextResponse.json({ success: true });
}