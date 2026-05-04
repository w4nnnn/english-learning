'use server';

import { authenticateAdmin, getFileUrl } from '@/lib/pocketbase';

const COLLECTION_NAME = process.env.POCKETBASE_MEDIA_COLLECTION || 'demo_english_learn';
const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/ogg'];
const FILE_FIELD_NAME = process.env.POCKETBASE_FILE_FIELD || 'file';

export interface UploadResult {
    success: boolean;
    url?: string;
    error?: string;
    recordId?: string;
    filename?: string;
}

function extractFilename(record: Record<string, unknown>, fields: string[]): string | null {
    for (const field of fields) {
        const value = record[field];
        if (typeof value === 'string' && value.length > 0) {
            return value;
        }
        if (Array.isArray(value) && value.length > 0 && typeof value[0] === 'string') {
            return value[0];
        }
    }

    return null;
}

export async function uploadMedia(formData: FormData): Promise<UploadResult> {
    try {
        const file = formData.get('file') as File;

        if (!file || file.size === 0) {
            return { success: false, error: 'No file provided' };
        }

        // Validate file size
        if (file.size > MAX_FILE_SIZE) {
            console.error('[Upload] File too large');
            return { success: false, error: 'File size exceeds 50MB limit' };
        }

        // Validate file type
        const isImage = ALLOWED_IMAGE_TYPES.includes(file.type);
        const isVideo = ALLOWED_VIDEO_TYPES.includes(file.type);

        if (!isImage && !isVideo) {
            console.error(`[Upload] Unsupported type: ${file.type}`);
            return {
                success: false,
                error: `Unsupported file type: ${file.type}. Allowed: images (JPEG, PNG, GIF, WebP) and videos (MP4, WebM, OGG)`
            };
        }

        // Authenticate and upload
        const pb = await authenticateAdmin();

        // Create form data for PocketBase
        const pbFormData = new FormData();
        pbFormData.append(FILE_FIELD_NAME, file);
        pbFormData.append('alt', formData.get('alt') as string || file.name);
        pbFormData.append('type', isImage ? 'image' : 'video');

        // Create record in collection
        const record = await pb.collection(COLLECTION_NAME).create(pbFormData);

        // Get the uploaded file URL
        // Handle both single (string) and multiple (array) response formats
        const filename = extractFilename(record, [FILE_FIELD_NAME]);

        if (!filename) {
            return { success: false, error: 'File upload succeeded but filename is missing' };
        }

        const url = getFileUrl(COLLECTION_NAME, record.id, filename);

        return {
            success: true,
            url,
            recordId: record.id,
            filename,
        };
    } catch (error) {
        console.error('[Upload] Error:', error);
        if (typeof error === 'object' && error !== null && 'data' in error) {
            console.error('[Upload] PocketBase error details:', JSON.stringify((error as any).data, null, 2));
        }
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Upload failed',
        };
    }
}

export async function deleteMedia(recordId: string): Promise<{ success: boolean; error?: string }> {
    try {
        const pb = await authenticateAdmin();
        await pb.collection(COLLECTION_NAME).delete(recordId);
        return { success: true };
    } catch (error) {
        console.error('Media delete error:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Delete failed',
        };
    }
}
