#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
微信公众号文章图片下载脚本
从指定的微信公众号文章链接下载所有图片
"""

import os
import re
import sys
import json
import requests
from urllib.parse import urljoin, urlparse
from pathlib import Path
import time

# 修复Windows控制台编码问题
if sys.platform == 'win32':
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

# 目标URL
TARGET_URL = "https://mp.weixin.qq.com/s/YblgXGoZfF4hRnMWcYnFWQ"

# 输出目录
OUTPUT_DIR = Path("assets/images/ultraman")

# 确保输出目录存在
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

# 请求头，模拟浏览器
HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
    'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
    'Accept-Encoding': 'gzip, deflate, br',
    'Connection': 'keep-alive',
    'Upgrade-Insecure-Requests': '1',
    'Sec-Fetch-Dest': 'document',
    'Sec-Fetch-Mode': 'navigate',
    'Sec-Fetch-Site': 'none',
    'Cache-Control': 'max-age=0',
    'Referer': 'https://mp.weixin.qq.com/'
}

def extract_images_from_html(html):
    """从HTML中提取图片URL"""
    image_urls = []
    
    # 微信公众号文章的图片通常在data-src属性中
    # 模式1: data-src
    data_src_pattern = r'data-src=["\']([^"\']+)["\']'
    matches = re.findall(data_src_pattern, html)
    for match in matches:
        if any(ext in match.lower() for ext in ['.jpg', '.jpeg', '.png', '.gif', '.webp', 'wx_fmt']):
            if match not in image_urls:
                image_urls.append(match)
    
    # 模式2: src属性
    src_pattern = r'<img[^>]+src=["\']([^"\']+)["\']'
    matches = re.findall(src_pattern, html)
    for match in matches:
        if any(ext in match.lower() for ext in ['.jpg', '.jpeg', '.png', '.gif', '.webp', 'wx_fmt']):
            if match not in image_urls:
                image_urls.append(match)
    
    # 模式3: CSS背景图片
    bg_pattern = r'background-image:\s*url\(["\']?([^"\'()]+)["\']?\)'
    matches = re.findall(bg_pattern, html)
    for match in matches:
        if any(ext in match.lower() for ext in ['.jpg', '.jpeg', '.png', '.gif', '.webp', 'wx_fmt']):
            if match not in image_urls:
                image_urls.append(match)
    
    # 模式4: 微信公众号特定的图片格式 (mmbiz.qpic.cn)
    wechat_pattern = r'https?://mmbiz\.qpic\.cn/[^\s<>"\']+'
    matches = re.findall(wechat_pattern, html)
    for match in matches:
        if match not in image_urls:
            image_urls.append(match)
    
    return image_urls

def download_image(url, filepath):
    """下载单个图片"""
    try:
        # 对于微信公众号图片，可能需要添加特定的参数
        if 'mmbiz.qpic.cn' in url:
            # 确保URL包含正确的参数
            if 'wx_fmt' not in url:
                # 尝试添加格式参数
                separator = '&' if '?' in url else '?'
                url = url + separator + 'wx_fmt=jpeg'
        
        response = requests.get(url, headers=HEADERS, timeout=30, stream=True)
        response.raise_for_status()
        
        with open(filepath, 'wb') as f:
            for chunk in response.iter_content(chunk_size=8192):
                f.write(chunk)
        
        return True
    except Exception as e:
        print(f"下载失败: {e}")
        return False

def get_filename_from_url(url, index):
    """从URL生成文件名"""
    # 尝试从URL提取文件名
    parsed = urlparse(url)
    path = parsed.path
    
    # 如果是微信公众号的图片，尝试提取文件名
    if 'mmbiz.qpic.cn' in url:
        # 提取图片ID
        match = re.search(r'/([^/]+)$', path)
        if match:
            img_id = match.group(1)
            # 检查URL中的格式参数
            fmt_match = re.search(r'wx_fmt=(\w+)', url)
            ext = fmt_match.group(1) if fmt_match else 'jpg'
            return f"ultraman_{img_id}.{ext}"
    
    # 从路径提取文件名
    filename = os.path.basename(path)
    if filename and '.' in filename:
        return filename
    
    # 默认文件名
    return f"ultraman_{index:03d}.jpg"

def main():
    print(f"正在访问: {TARGET_URL}")
    print("=" * 50)
    
    try:
        # 获取页面内容
        response = requests.get(TARGET_URL, headers=HEADERS, timeout=30)
        response.encoding = 'utf-8'
        html = response.text
        
        print(f"页面获取成功，状态码: {response.status_code}")
        
        # 检查是否需要验证
        if "环境异常" in html or "验证" in html or "captcha" in html.lower():
            print("\n⚠️ 警告: 页面可能需要验证，无法直接访问")
            print("建议:")
            print("1. 在浏览器中打开链接并完成验证")
            print("2. 使用浏览器开发者工具提取图片URL")
            print("3. 或者使用selenium等工具自动化浏览器")
            
            # 保存HTML以便检查
            debug_file = OUTPUT_DIR.parent / "page_debug.html"
            with open(debug_file, 'w', encoding='utf-8') as f:
                f.write(html)
            print(f"\n页面内容已保存到: {debug_file}")
            return
        
        # 提取图片URL
        print("\n正在提取图片URL...")
        image_urls = extract_images_from_html(html)
        
        if not image_urls:
            print("未找到图片URL")
            print("\n尝试保存HTML以便手动检查...")
            debug_file = OUTPUT_DIR.parent / "page_debug.html"
            with open(debug_file, 'w', encoding='utf-8') as f:
                f.write(html)
            print(f"HTML已保存到: {debug_file}")
            return
        
        print(f"找到 {len(image_urls)} 个图片URL")
        
        # 显示找到的URL
        for i, url in enumerate(image_urls, 1):
            print(f"  {i}. {url[:80]}...")
        
        # 下载图片
        print(f"\n开始下载图片到: {OUTPUT_DIR}")
        print("=" * 50)
        
        success_count = 0
        fail_count = 0
        
        for i, url in enumerate(image_urls, 1):
            filename = get_filename_from_url(url, i)
            filepath = OUTPUT_DIR / filename
            
            # 如果文件已存在，跳过
            if filepath.exists():
                print(f"[{i}/{len(image_urls)}] 跳过已存在: {filename}")
                continue
            
            print(f"[{i}/{len(image_urls)}] 下载中: {filename}")
            if download_image(url, filepath):
                # 检查文件大小
                size = filepath.stat().st_size
                if size > 0:
                    print(f"  [OK] Success ({size / 1024:.2f} KB)")
                    success_count += 1
                else:
                    print(f"  [FAIL] File size is 0")
                    filepath.unlink()
                    fail_count += 1
            else:
                fail_count += 1
            
            # 延迟避免请求过快
            time.sleep(1)
        
        print("=" * 50)
        print(f"\n下载完成！")
        print(f"成功: {success_count}, 失败: {fail_count}")
        
        if success_count > 0:
            print(f"\n图片已保存到: {OUTPUT_DIR.absolute()}")
    
    except requests.exceptions.RequestException as e:
        print(f"请求错误: {e}")
        print("\n可能的原因:")
        print("1. 网络连接问题")
        print("2. 网站需要验证或登录")
        print("3. 网站有反爬虫保护")
    except Exception as e:
        print(f"发生错误: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    main()

