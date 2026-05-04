'use client';

import { useState, useRef, useCallback } from 'react';
import { Upload, X, Loader2, Image as ImageIcon, Video, CheckCircle, Link as LinkIcon } from 'lucide-react';
import { uploadMedia } from '@/lib/actions/upload-media';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface MediaUploaderProps {
    value?: string;
    onChange: (url: string) => void;
    accept?: 'image' | 'video' | 'both';
    className?: string;
    label?: string;
}

export function MediaUploader({
    value,
    onChange,
    accept = 'both',
    className = '',
    label,
}: MediaUploaderProps) {
    const [isUploading, setIsUploading] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const acceptTypes = accept === 'image'
        ? 'image/jpeg,image/png,image/gif,image/webp'
        : accept === 'video'
            ? 'video/mp4,video/webm,video/ogg'
            : 'image/jpeg,image/png,image/gif,image/webp,video/mp4,video/webm,video/ogg';

    const handleUpload = useCallback(async (file: File) => {
        setIsUploading(true);
        setError(null);

        try {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('alt', file.name);

            const result = await uploadMedia(formData);

            if (result.success && result.url) {
                onChange(result.url);
            } else {
                setError(result.error || 'Upload failed');
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Upload failed');
        } finally {
            setIsUploading(false);
        }
    }, [onChange]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            handleUpload(file);
        }
    };

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);

        const file = e.dataTransfer.files?.[0];
        if (file) {
            handleUpload(file);
        }
    }, [handleUpload]);

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = () => {
        setIsDragging(false);
    };

    const handleRemove = () => {
        onChange('');
        setError(null);
    };

    // Helper to extract YouTube video ID
    const getYouTubeId = (url: string): string | null => {
        const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([^&?\s]+)/);
        return match ? match[1] : null;
    };

    // Helper to extract Vimeo video ID
    const getVimeoId = (url: string): string | null => {
        const match = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
        return match ? match[1] : null;
    };

    // Detect media type
    const youtubeId = value ? getYouTubeId(value) : null;
    const vimeoId = value ? getVimeoId(value) : null;
    const isEmbedVideo = youtubeId || vimeoId;
    const isDirectVideo = value?.match(/\.(mp4|webm|ogg)/i);
    const isVideo = isEmbedVideo || isDirectVideo;
    // Image is default fallback for any URL that isn't a video
    const isImage = value && !isVideo;

    return (
        <div className={className}>
            {label && (
                <label className="block text-sm font-medium text-slate-700 mb-2">
                    {label}
                </label>
            )}

            {value ? (
                <div className="relative rounded-lg border border-slate-200 overflow-hidden bg-slate-50">
                    {isImage && (
                        <div className="aspect-video bg-slate-100 flex items-center justify-center">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                                src={value}
                                alt="Uploaded media"
                                className="max-w-full max-h-full object-contain"
                                onError={(e) => {
                                    // Hide broken images and show fallback
                                    const target = e.target as HTMLImageElement;
                                    target.style.display = 'none';
                                    target.nextElementSibling?.classList.remove('hidden');
                                }}
                            />
                            <div className="hidden text-center text-slate-500">
                                <CheckCircle className="w-8 h-8 mx-auto mb-2 text-green-500" />
                                <p className="text-sm">URL Set</p>
                                <p className="text-xs truncate max-w-48">{value}</p>
                            </div>
                        </div>
                    )}
                    {youtubeId && (
                        <div className="aspect-video bg-black">
                            <iframe
                                src={`https://www.youtube-nocookie.com/embed/${youtubeId}`}
                                className="w-full h-full"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                allowFullScreen
                            />
                        </div>
                    )}
                    {vimeoId && (
                        <div className="aspect-video bg-black">
                            <iframe
                                src={`https://player.vimeo.com/video/${vimeoId}`}
                                className="w-full h-full"
                                allow="autoplay; fullscreen; picture-in-picture"
                                allowFullScreen
                            />
                        </div>
                    )}
                    {isDirectVideo && (
                        <div className="aspect-video bg-black">
                            <video
                                src={value}
                                controls
                                className="w-full h-full object-contain"
                            />
                        </div>
                    )}
                    <button
                        type="button"
                        onClick={handleRemove}
                        className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors shadow-lg"
                        title="Remove"
                    >
                        <X className="w-4 h-4" />
                    </button>
                    {/* Show URL for reference */}
                    <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-[10px] px-2 py-1 truncate">
                        {value}
                    </div>
                </div>
            ) : (
                <Tabs defaultValue="upload" className="w-full">
                    <TabsList className="grid w-full grid-cols-2 mb-2">
                        <TabsTrigger value="upload">Upload File</TabsTrigger>
                        <TabsTrigger value="link">Link URL</TabsTrigger>
                    </TabsList>

                    <TabsContent value="upload" className="mt-0">
                        <div
                            onClick={() => inputRef.current?.click()}
                            onDrop={handleDrop}
                            onDragOver={handleDragOver}
                            onDragLeave={handleDragLeave}
                            className={`
                                relative border-2 border-dashed rounded-lg p-8 text-center cursor-pointer min-h-[200px] flex flex-col justify-center
                                transition-all duration-200
                                ${isDragging
                                    ? 'border-blue-500 bg-blue-50'
                                    : 'border-slate-300 hover:border-blue-400 hover:bg-slate-50'
                                }
                                ${isUploading ? 'pointer-events-none opacity-50' : ''}
                            `}
                        >
                            <input
                                ref={inputRef}
                                type="file"
                                accept={acceptTypes}
                                onChange={handleFileChange}
                                className="hidden"
                            />

                            {isUploading ? (
                                <div className="flex flex-col items-center gap-2">
                                    <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
                                    <p className="text-sm text-slate-600">Uploading...</p>
                                </div>
                            ) : (
                                <div className="flex flex-col items-center gap-3">
                                    <div className="flex gap-2">
                                        {(accept === 'image' || accept === 'both') && (
                                            <ImageIcon className="w-6 h-6 text-slate-400" />
                                        )}
                                        {(accept === 'video' || accept === 'both') && (
                                            <Video className="w-6 h-6 text-slate-400" />
                                        )}
                                    </div>
                                    <div>
                                        <p className="font-medium text-slate-700">
                                            Drop {accept === 'both' ? 'file' : accept} here or click to upload
                                        </p>
                                        <p className="text-sm text-slate-500 mt-1">
                                            {accept === 'image' && 'JPEG, PNG, GIF, WebP up to 50MB'}
                                            {accept === 'video' && 'MP4, WebM, OGG up to 50MB'}
                                            {accept === 'both' && 'Images & Videos up to 50MB'}
                                        </p>
                                    </div>
                                    <Upload className="w-5 h-5 text-slate-400" />
                                </div>
                            )}
                        </div>
                    </TabsContent>

                    <TabsContent value="link" className="mt-0">
                        <div className="border rounded-lg p-6 bg-slate-50 min-h-[200px] flex flex-col justify-center">
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-slate-700">
                                        Paste Image/Video URL
                                    </label>
                                    <div className="flex gap-2">
                                        <input
                                            type="url"
                                            placeholder="https://example.com/image.jpg"
                                            className="flex-1 px-3 py-2 bg-white border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter') {
                                                    e.preventDefault();
                                                    const url = e.currentTarget.value;
                                                    if (url) onChange(url);
                                                }
                                            }}
                                            onBlur={(e) => {
                                                // Optional: auto-save on blur if value exists
                                                // const url = e.target.value;
                                                // if (url) onChange(url);
                                            }}
                                        />
                                        <button
                                            type="button"
                                            onClick={(e) => {
                                                const input = e.currentTarget.previousElementSibling as HTMLInputElement;
                                                if (input.value) onChange(input.value);
                                            }}
                                            className="px-4 py-2 bg-slate-900 text-white text-sm font-medium rounded-md hover:bg-slate-800 transition-colors"
                                        >
                                            Add
                                        </button>
                                    </div>
                                    <p className="text-xs text-slate-500">
                                        Supports direct links to images (jpg, png) or videos (mp4).
                                        Note: Some external links may not preview correctly.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </TabsContent>
                </Tabs>
            )}

            {error && (
                <p className="mt-2 text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">
                    {error}
                </p>
            )}
        </div>
    );
}
