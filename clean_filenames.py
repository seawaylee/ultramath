#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
清理文件名中的异常字符
"""

import re
from pathlib import Path

# 图片目录
IMAGE_DIR = Path(__file__).parent / 'assets' / 'images' / 'ultraman'

def clean_filename(filename):
    """清理文件名中的异常字符"""
    # 移除文件名末尾的引号、逗号、括号等
    cleaned = filename.rstrip("',)\" ")
    
    # 确保扩展名正确（移除扩展名中的异常字符）
    if '.' in cleaned:
        name, ext = cleaned.rsplit('.', 1)
        # 清理扩展名
        ext = ext.rstrip("',)\" ")
        cleaned = f"{name}.{ext}"
    
    return cleaned

def main():
    print('=' * 60)
    print('清理文件名中的异常字符')
    print('=' * 60)
    print()
    
    if not IMAGE_DIR.exists():
        print(f'错误: 目录不存在: {IMAGE_DIR}')
        return
    
    # 获取所有文件
    files = list(IMAGE_DIR.glob('*'))
    files = [f for f in files if f.is_file()]
    
    if not files:
        print('未找到文件')
        return
    
    print(f'找到 {len(files)} 个文件\n')
    
    fixed_count = 0
    skipped_count = 0
    
    for filepath in sorted(files):
        original_name = filepath.name
        cleaned_name = clean_filename(original_name)
        
        if original_name == cleaned_name:
            skipped_count += 1
            continue
        
        new_path = filepath.parent / cleaned_name
        
        # 如果目标文件已存在，跳过（可能已经清理过）
        if new_path.exists() and new_path != filepath:
            print(f'跳过: {original_name} (目标文件已存在)')
            skipped_count += 1
            continue
        
        try:
            filepath.rename(new_path)
            print(f'已修复: {original_name} -> {cleaned_name}')
            fixed_count += 1
        except Exception as e:
            print(f'错误: {original_name} - {e}')
    
    print()
    print('=' * 60)
    print(f'完成！修复: {fixed_count}, 跳过: {skipped_count}')
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

