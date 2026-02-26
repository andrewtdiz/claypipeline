import { useEffect, useState } from "react";
import { bitmapToBlob } from "pipemagic";

type PreviewFormat = "png" | "jpeg" | "webp";

interface PreviewOptions {
  format?: PreviewFormat;
  quality?: number;
}

export function useBitmapPreviewUrl(bitmap?: ImageBitmap | null, options: PreviewOptions = {}) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const { format = "png", quality } = options;

  useEffect(() => {
    let cancelled = false;
    let url: string | null = null;

    const buildPreview = async () => {
      if (!bitmap) {
        setPreviewUrl(null);
        return;
      }

      const blob = await bitmapToBlob(bitmap, format, quality);
      if (cancelled) return;
      url = URL.createObjectURL(blob);
      setPreviewUrl(url);
    };

    buildPreview();

    return () => {
      cancelled = true;
      if (url) URL.revokeObjectURL(url);
    };
  }, [bitmap, format, quality]);

  return previewUrl;
}
