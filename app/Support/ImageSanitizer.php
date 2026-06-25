<?php

namespace App\Support;

use Illuminate\Http\UploadedFile;

class ImageSanitizer
{
    /**
     * Re-encode image to strip EXIF metadata and any embedded payloads.
     * Uses GD (already required by Laravel).
     * Safe for jpg, png, webp, gif.
     */
    public static function sanitize(UploadedFile $file, string $outputPath): bool
    {
        $realPath = $file->getRealPath();
        $mime = $file->getMimeType();

        $image = match ($mime) {
            'image/jpeg' => @imagecreatefromjpeg($realPath),
            'image/png' => @imagecreatefrompng($realPath),
            'image/webp' => @imagecreatefromwebp($realPath),
            'image/gif' => @imagecreatefromgif($realPath),
            default => null,
        };

        if (! $image) {
            return false;
        }

        match ($mime) {
            'image/jpeg' => imagejpeg($image, $outputPath, 85),
            'image/png' => imagepng($image, $outputPath, 6),
            'image/webp' => imagewebp($image, $outputPath, 85),
            'image/gif' => imagegif($image, $outputPath),
            default => null,
        };

        imagedestroy($image);

        return true;
    }
}