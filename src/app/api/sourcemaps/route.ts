import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData();
        const file = formData.get('file') as File;
        const release = formData.get('release') as string;

        if (!file || !release) {
            return NextResponse.json({ error: 'Missing file or release' }, { status: 400 });
        }

        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        // Directory structure: ./uploaded-sourcemaps/{release}/
        const uploadDir = path.join(process.cwd(), 'uploaded-sourcemaps', release);
        try {
            await mkdir(uploadDir, { recursive: true });
        } catch (e) {
            // ignore if exists
        }

        const filePath = path.join(uploadDir, file.name);
        await writeFile(filePath, buffer);

        console.log(`Uploaded source map: ${filePath}`);

        return NextResponse.json({ success: true, path: filePath });
    } catch (error) {
        console.error('Source map upload error:', error);
        return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
    }
}
