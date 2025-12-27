// 奥特曼图片管理工具

// 图片路径（相对于public目录，Vite会自动处理public目录下的文件）
const ULTraman_IMAGE_BASE = '/assets/images/ultraman/';

// 图片列表（在运行时加载）
let imageListCache: string[] | null = null;

// 初始化图片列表
async function initImageList(): Promise<string[]> {
  if (imageListCache) {
    return imageListCache;
  }

  try {
    // 尝试从JSON文件加载图片列表
    const response = await fetch('/assets/images/ultraman-list.json');
    if (response.ok) {
      const data = await response.json();
      imageListCache = data.images || [];
      return imageListCache;
    }
  } catch (error) {
    console.warn('无法加载图片列表，使用默认列表', error);
  }

  // 如果加载失败，使用一个默认的小列表作为后备
  imageListCache = [
    'ultraman_0.jpg',
    'ultraman_102.jpg',
    'ultraman_640.jpg',
    'ultraman_640.png',
  ];
  
  return imageListCache;
}

// 获取随机图片URL
export async function getRandomUltramanImage(): Promise<string> {
  const images = await initImageList();
  if (images.length === 0) {
    return `${ULTraman_IMAGE_BASE}ultraman_0.jpg`;
  }
  const randomIndex = Math.floor(Math.random() * images.length);
  return `${ULTraman_IMAGE_BASE}${images[randomIndex]}`;
}

// 同步版本（使用缓存的列表，如果还未初始化则返回默认值）
export function getRandomUltramanImageSync(): string {
  if (!imageListCache || imageListCache.length === 0) {
    // 如果列表还未加载，使用一个随机生成的名称（基于常见的文件）
    const fallbackImages = ['ultraman_0.jpg', 'ultraman_102.jpg', 'ultraman_640.jpg'];
    const randomIndex = Math.floor(Math.random() * fallbackImages.length);
    return `${ULTraman_IMAGE_BASE}${fallbackImages[randomIndex]}`;
  }
  const randomIndex = Math.floor(Math.random() * imageListCache.length);
  return `${ULTraman_IMAGE_BASE}${imageListCache[randomIndex]}`;
}

// 获取多个随机图片URL（不重复）
export async function getRandomUltramanImages(count: number): Promise<string[]> {
  const images = await initImageList();
  if (images.length === 0) {
    return [`${ULTraman_IMAGE_BASE}ultraman_0.jpg`];
  }
  
  // 如果请求的数量大于可用图片数，允许重复
  const selected: string[] = [];
  const used = new Set<number>();
  
  for (let i = 0; i < count && selected.length < images.length * 2; i++) {
    let randomIndex: number;
    do {
      randomIndex = Math.floor(Math.random() * images.length);
    } while (used.has(randomIndex) && used.size < images.length);
    
    used.add(randomIndex);
    selected.push(`${ULTraman_IMAGE_BASE}${images[randomIndex]}`);
  }
  
  return selected;
}

// 同步版本
export function getRandomUltramanImagesSync(count: number): string[] {
  if (!imageListCache || imageListCache.length === 0) {
    const fallback = ['ultraman_0.jpg', 'ultraman_102.jpg', 'ultraman_640.jpg'];
    return Array.from({ length: count }, () => 
      `${ULTraman_IMAGE_BASE}${fallback[Math.floor(Math.random() * fallback.length)]}`
    );
  }
  
  const selected: string[] = [];
  const used = new Set<number>();
  
  for (let i = 0; i < count && selected.length < imageListCache.length * 2; i++) {
    let randomIndex: number;
    do {
      randomIndex = Math.floor(Math.random() * imageListCache.length);
    } while (used.has(randomIndex) && used.size < imageListCache.length);
    
    used.add(randomIndex);
    selected.push(`${ULTraman_IMAGE_BASE}${imageListCache[randomIndex]}`);
  }
  
  return selected;
}

// 根据索引获取图片
export async function getUltramanImageByIndex(index: number): Promise<string> {
  const images = await initImageList();
  if (images.length === 0) {
    return `${ULTraman_IMAGE_BASE}ultraman_0.jpg`;
  }
  const safeIndex = index % images.length;
  return `${ULTraman_IMAGE_BASE}${images[safeIndex]}`;
}

// 同步版本
export function getUltramanImageByIndexSync(index: number): string {
  if (!imageListCache || imageListCache.length === 0) {
    return `${ULTraman_IMAGE_BASE}ultraman_0.jpg`;
  }
  const safeIndex = index % imageListCache.length;
  return `${ULTraman_IMAGE_BASE}${imageListCache[safeIndex]}`;
}

// 获取所有图片URL
export async function getAllUltramanImages(): Promise<string[]> {
  const images = await initImageList();
  return images.map(filename => `${ULTraman_IMAGE_BASE}${filename}`);
}

// 预加载图片列表（在应用启动时调用）
export async function preloadImageList(): Promise<void> {
  await initImageList();
}

