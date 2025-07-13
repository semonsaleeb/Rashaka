// src/app/utils/asset.utils.ts
export class AssetUtils {
  static getSafeImageUrl(url: string | null | undefined): string {
    if (!url) {
      return 'assets/images/fallback-blog.jpg';
    }
    
    try {
      new URL(url); // Validate URL
      return url;
    } catch {
      return 'assets/images/fallback-blog.jpg';
    }
  }
  
  static getSafeVideoUrl(url: string | null | undefined): string {
    // Similar logic for videos
    return url || 'assets/videos/fallback-video.mp4';
  }
}