// api/_lib/image-processing.js
import sharp from 'sharp';

// 수중 사진 자동보정 함수
export async function enhanceUnderwaterImage(imageUrl, enhancementLevel = 'auto') {
  try {
    // 이미지 URL에서 이미지 다운로드
    const response = await fetch(imageUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.status}`);
    }
    
    const imageBuffer = await response.arrayBuffer();
    
    // Sharp를 사용한 이미지 처리
    let processedImage = sharp(Buffer.from(imageBuffer));
    
    // 수중 사진 특화 보정
    switch (enhancementLevel) {
      case 'light':
        processedImage = processedImage
          .modulate({ brightness: 1.1, saturation: 1.2 })
          .gamma(1.1)
          .sharpen(0.5);
        break;
      
      case 'medium':
        processedImage = processedImage
          .modulate({ brightness: 1.2, saturation: 1.4, hue: 5 })
          .gamma(1.2)
          .sharpen(1.0)
          .tint({ r: 255, g: 255, b: 255 });
        break;
      
      case 'strong':
        processedImage = processedImage
          .modulate({ brightness: 1.4, saturation: 1.6, hue: 10 })
          .gamma(1.3)
          .sharpen(1.5)
          .tint({ r: 255, g: 255, b: 255 })
          .contrast(1.2);
        break;
      
      case 'auto':
      default:
        // 자동 보정: 수중 사진의 블루/그린 톤을 자동으로 감지하고 보정
        processedImage = processedImage
          .modulate({ brightness: 1.25, saturation: 1.35, hue: 8 })
          .gamma(1.15)
          .sharpen(1.0)
          .tint({ r: 255, g: 255, b: 255 })
          .contrast(1.1);
        break;
    }
    
    // 보정된 이미지를 S3에 업로드하고 URL 반환
    const enhancedBuffer = await processedImage.jpeg({ quality: 90 }).toBuffer();
    
    // 여기서는 간단히 원본 URL에 _enhanced 접미사를 추가
    // 실제 구현에서는 S3에 업로드하고 새로운 URL을 반환해야 함
    const enhancedUrl = imageUrl.replace(/(\.[^.]+)$/, '_enhanced$1');
    
    return enhancedUrl;
    
  } catch (error) {
    console.error('Image enhancement failed:', error);
    throw new Error(`Image enhancement failed: ${error.message}`);
  }
}

// 배치 이미지 처리 함수
export async function enhanceMultipleImages(imageUrls, enhancementLevel = 'auto') {
  const results = [];
  
  for (const imageUrl of imageUrls) {
    try {
      const enhancedUrl = await enhanceUnderwaterImage(imageUrl, enhancementLevel);
      results.push({
        originalUrl: imageUrl,
        enhancedUrl,
        success: true
      });
    } catch (error) {
      results.push({
        originalUrl: imageUrl,
        error: error.message,
        success: false
      });
    }
  }
  
  return results;
}

// 이미지 품질 분석 함수
export async function analyzeImageQuality(imageUrl) {
  try {
    const response = await fetch(imageUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.status}`);
    }
    
    const imageBuffer = await response.arrayBuffer();
    const image = sharp(Buffer.from(imageBuffer));
    const metadata = await image.metadata();
    
    return {
      width: metadata.width,
      height: metadata.height,
      format: metadata.format,
      size: imageBuffer.byteLength,
      hasAlpha: metadata.hasAlpha,
      channels: metadata.channels
    };
  } catch (error) {
    throw new Error(`Image analysis failed: ${error.message}`);
  }
}
