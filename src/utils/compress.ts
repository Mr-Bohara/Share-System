import * as pako from "pako";

/**
 * Compresses an image file using browser-native Canvas API.
 * Resizes the image if it exceeds max dimensions and reduces quality.
 */
export async function compressImage(file: File, maxWidth = 1920, maxHeight = 1080, quality = 0.8): Promise<File> {
  if (!file.type.startsWith("image/") || file.type === "image/gif" || file.type === "image/svg+xml") {
    return file; // Skip compression for non-images, gifs (animation loss), and svgs
  }

  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);

      let { width, height } = img;
      
      // Calculate new dimensions while maintaining aspect ratio
      if (width > maxWidth || height > maxHeight) {
        if (width / height > maxWidth / maxHeight) {
          height = Math.round(height * (maxWidth / width));
          width = maxWidth;
        } else {
          width = Math.round(width * (maxHeight / height));
          height = maxHeight;
        }
      }

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext("2d");
      if (!ctx) {
        resolve(file); // Fallback to original if canvas fails
        return;
      }

      ctx.drawImage(img, 0, 0, width, height);

      // Convert to WebP or JPEG
      const outputType = file.type === "image/png" ? "image/png" : "image/jpeg";
      const outputQuality = outputType === "image/png" ? undefined : quality;

      canvas.toBlob(
        (blob) => {
          if (blob) {
            // Check if compressed file is actually smaller
            if (blob.size < file.size) {
              const compressedFile = new File([blob], file.name, {
                type: outputType,
                lastModified: Date.now(),
              });
              resolve(compressedFile);
            } else {
              resolve(file); // Fallback to original if compression made it larger
            }
          } else {
            resolve(file);
          }
        },
        outputType,
        outputQuality
      );
    };

    img.onerror = () => resolve(file); // Fallback to original on error
    img.src = url;
  });
}

/**
 * Compresses a text file using Pako (zlib/gzip).
 */
export async function compressTextFile(file: File): Promise<File> {
  const isText = file.type.startsWith("text/") || 
                 file.name.endsWith(".txt") || 
                 file.name.endsWith(".json") || 
                 file.name.endsWith(".md") || 
                 file.name.endsWith(".csv");
                 
  if (!isText) {
    return file; 
  }
  
  // Don't compress small text files (< 1KB) as overhead might make them larger
  if (file.size < 1024) {
    return file;
  }

  try {
    const arrayBuffer = await file.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);
    
    // Gzip compression
    const compressed = pako.gzip(uint8Array);
    
    // Check if compressed is actually smaller
    if (compressed.length < uint8Array.length) {
      const compressedFile = new File([compressed], `${file.name}.gz`, {
        type: "application/gzip",
        lastModified: Date.now(),
      });
      return compressedFile;
    }
    
    return file;
  } catch (err) {
    console.warn("Text compression failed:", err);
    return file;
  }
}

/**
 * Main utility to compress a file before upload
 */
export async function processFileForUpload(file: File): Promise<File> {
  if (file.type.startsWith("image/")) {
    return compressImage(file);
  } else if (
    file.type.startsWith("text/") || 
    file.name.endsWith(".txt") || 
    file.name.endsWith(".json") || 
    file.name.endsWith(".md") || 
    file.name.endsWith(".csv")
  ) {
    return compressTextFile(file);
  }
  
  return file;
}
