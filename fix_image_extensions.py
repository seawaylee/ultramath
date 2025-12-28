#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
修复图片文件扩展名
根据文件的实际内容（文件头）来确定正确的扩展名
"""

import os
import struct
from pathlib import Path

# 图片目录
IMAGE_DIR = Path(__file__).parent / 'assets' / 'images' / 'ultraman'

# 文件头签名（魔数）
IMAGE_SIGNATURES = {
    b'\xff\xd8\xff': '.jpg',  # JPEG
    b'\x89PNG\r\n\x1a\n': '.png',  # PNG
    b'GIF87a': '.gif',  # GIF87a
    b'GIF89a': '.gif',  # GIF89a
    b'RIFF': '.webp',  # WebP (需要进一步检查)
    b'BM': '.bmp',  # BMP
}

def get_image_type(filepath):
    """通过文件头判断图片类型"""
    try:
        with open(filepath, 'rb') as f:
            header = f.read(12)
            
            # JPEG
            if header[:3] == b'\xff\xd8\xff':
                return '.jpg'
            
            # PNG
            if header[:8] == b'\x89PNG\r\n\x1a\n':
                return '.png'
            
            # GIF
            if header[:6] in (b'GIF87a', b'GIF89a'):
                return '.gif'
            
            # WebP (RIFF...WEBP)
            if header[:4] == b'RIFF' and header[8:12] == b'WEBP':
                return '.webp'
            
            # BMP
            if header[:2] == b'BM':
                return '.bmp'
            
            return None
    except Exception as e:
        print(f'  读取文件错误: {e}')
        return None

def fix_file_extension(filepath):
    """修复文件扩展名"""
    actual_ext = get_image_type(filepath)
    if not actual_ext:
        return False, None, '无法识别文件类型'
    
    current_ext = filepath.suffix.lower()
    if current_ext == actual_ext:
        return False, None, '扩展名正确'
    
    # 生成新文件名
    new_name = filepath.stem + actual_ext
    new_path = filepath.parent / new_name
    
    # 如果目标文件已存在，添加序号
    counter = 1
    while new_path.exists() and new_path != filepath:
        new_name = f"{filepath.stem}_{counter}{actual_ext}"
        new_path = filepath.parent / new_name
        counter += 1
    
    try:
        filepath.rename(new_path)
        return True, new_path.name, f'{current_ext} -> {actual_ext}'
    except Exception as e:
        return False, None, f'重命名失败: {e}'

def main():
    print('=' * 60)
    print('修复图片文件扩展名')
    print('=' * 60)
    print()
    
    if not IMAGE_DIR.exists():
        print(f'错误: 目录不存在: {IMAGE_DIR}')
        return
    
    # 获取所有文件
    files = list(IMAGE_DIR.glob('*'))
    image_files = [f for f in files if f.is_file() and f.suffix.lower() in ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp']]
    
    if not image_files:
        print('未找到图片文件')
        return
    
    print(f'找到 {len(image_files)} 个图片文件\n')
    
    fixed_count = 0
    skipped_count = 0
    error_count = 0
    
    for filepath in sorted(image_files):
        print(f'检查: {filepath.name}', end=' ... ')
        
        success, new_name, message = fix_file_extension(filepath)
        
        if success:
            print(f'已修复 -> {new_name} ({message})')
            fixed_count += 1
        elif new_name is None:
            print(f'跳过 ({message})')
            skipped_count += 1
        else:
            print(f'错误: {message}')
            error_count += 1
    
    print()
    print('=' * 60)
    print(f'完成！修复: {fixed_count}, 跳过: {skipped_count}, 错误: {error_count}')
    print('=' * 60)

if __name__ == '__main__':
    try:
        main()
    except KeyboardInterrupt:
        print('\n\n用户中断')
    except Exception as e:
        print(f'\n错误: {e}')
        import traceback
        traceback.print_exc()



