// 生成图片列表的脚本
const fs = require('fs');
const path = require('path');

const IMAGE_DIR = path.join(__dirname, '..', 'assets', 'images', 'ultraman');
const OUTPUT_FILE = path.join(__dirname, '..', 'assets', 'images', 'ultraman-list.json');

const imageFiles = fs.readdirSync(IMAGE_DIR)
  .filter(file => /\.(jpg|jpeg|png|gif|webp)$/i.test(file))
  .sort();

const imageList = {
  count: imageFiles.length,
  images: imageFiles,
  generatedAt: new Date().toISOString()
};

fs.writeFileSync(OUTPUT_FILE, JSON.stringify(imageList, null, 2), 'utf8');

console.log(`Generated image list with ${imageFiles.length} images`);
console.log(`Saved to: ${OUTPUT_FILE}`);

