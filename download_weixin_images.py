#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
从微信公众号文章下载图片
"""

import os
import re
import sys
import urllib.request
import urllib.parse
from pathlib import Path
from html.parser import HTMLParser
import json

# 目标URL
TARGET_URL = 'https://mp.weixin.qq.com/s/YblgXGoZfF4hRnMWcYnFWQ'
OUTPUT_DIR = Path(__file__).parent / 'assets' / 'images' / 'ultraman'

# 确保输出目录存在
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

# 用户代理，模拟浏览器
USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'

class ImageExtractor(HTMLParser):
    """HTML解析器，用于提取图片URL"""
    def __init__(self):
        super().__init__()
        self.image_urls = []
        
    def handle_starttag(self, tag, attrs):
        if tag == 'img':
            # 查找src或data-src属性
            for attr_name, attr_value in attrs:
                if attr_name in ('src', 'data-src', 'data-original'):
                    if attr_value and self._is_image_url(attr_value):
                        # 处理相对路径和微信特有的图片URL
                        full_url = self._normalize_url(attr_value)
                        if full_url and full_url not in self.image_urls:
                            self.image_urls.append(full_url)
    
    def _is_image_url(self, url):
        """检查是否是图片URL"""
        if not url:
            return False
        url_lower = url.lower()
        # 微信图片可能包含这些特征
        return (
            any(ext in url_lower for ext in ['.jpg', '.jpeg', '.png', '.gif', '.webp']) or
            'mmbiz' in url_lower or  # 微信图片域名特征
            'wx_fmt' in url_lower    # 微信图片格式参数
        )
    
    def _normalize_url(self, url):
        """规范化URL"""
        if url.startswith('//'):
            return 'https:' + url
        elif url.startswith('/'):
            return 'https://mp.weixin.qq.com' + url
        elif url.startswith('http'):
            return url
        return None


def fetch_page(url):
    """获取网页内容"""
    print(f'正在获取页面: {url}')
    
    headers = {
        'User-Agent': USER_AGENT,
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
        'Referer': 'https://mp.weixin.qq.com/',
        'Connection': 'keep-alive',
    }
    
    try:
        req = urllib.request.Request(url, headers=headers)
        with urllib.request.urlopen(req, timeout=30) as response:
            # 尝试检测编码
            content = response.read()
            encoding = response.headers.get_content_charset() or 'utf-8'
            html = content.decode(encoding, errors='ignore')
            return html
    except urllib.error.HTTPError as e:
        print(f'HTTP错误: {e.code} - {e.reason}')
        if e.code == 403:
            print('提示: 可能遇到反爬虫保护，建议使用浏览器开发者工具手动提取图片URL')
        return None
    except Exception as e:
        print(f'错误: {e}')
        return None


def extract_image_urls(html):
    """从HTML中提取图片URL"""
    # 方法1: 使用HTMLParser
    parser = ImageExtractor()
    parser.feed(html)
    urls = parser.image_urls
    
    # 方法2: 使用正则表达式补充提取（处理JavaScript中的图片URL）
    # 匹配微信图片URL模式
    weixin_patterns = [
        r'https?://mmbiz[^"\s<>]+',
        r'https?://[^"\s<>]*wx_fmt[^"\s<>]+',
        r'data-src="([^"]+\.(?:jpg|jpeg|png|gif|webp))"',
        r'src="([^"]+\.(?:jpg|jpeg|png|gif|webp))"',
    ]
    
    for pattern in weixin_patterns:
        matches = re.findall(pattern, html, re.IGNORECASE)
        for match in matches:
            url = match if isinstance(match, str) else match
            if url.startswith('http') and url not in urls:
                urls.append(url)
    
    return urls


def download_image(url, filepath):
    """下载单个图片"""
    try:
        headers = {
            'User-Agent': USER_AGENT,
            'Accept': 'image/webp,image/apng,image/*,*/*;q=0.8',
            'Referer': 'https://mp.weixin.qq.com/',
        }
        
        req = urllib.request.Request(url, headers=headers)
        with urllib.request.urlopen(req, timeout=30) as response:
            with open(filepath, 'wb') as f:
                f.write(response.read())
        return True
    except Exception as e:
        print(f'  下载失败: {e}')
        return False


def get_filename_from_url(url):
    """从URL提取文件名"""
    # 解析URL
    parsed = urllib.parse.urlparse(url)
    path = parsed.path
    
    # 尝试从路径获取文件名
    filename = os.path.basename(path)
    if filename and '.' in filename:
        # 清理查询参数中的文件名
        filename = filename.split('?')[0]
        return filename
    
    # 如果没有文件名，尝试从查询参数获取
    params = urllib.parse.parse_qs(parsed.query)
    if 'wx_fmt' in params:
        fmt = params['wx_fmt'][0]
        # 使用URL的hash作为文件名
        import hashlib
        url_hash = hashlib.md5(url.encode()).hexdigest()[:8]
        return f'ultraman_{url_hash}.{fmt}'
    
    # 默认文件名
    import hashlib
    url_hash = hashlib.md5(url.encode()).hexdigest()[:8]
    return f'ultraman_{url_hash}.jpg'


def main():
    print('=' * 60)
    print('微信公众号图片下载工具')
    print('=' * 60)
    print()
    
    # 获取网页内容
    html = fetch_page(TARGET_URL)
    if not html:
        print('无法获取网页内容')
        return
    
    print('页面获取成功，正在解析图片URL...')
    
    # 保存HTML用于调试
    debug_file = OUTPUT_DIR.parent / 'page_debug.html'
    with open(debug_file, 'w', encoding='utf-8') as f:
        f.write(html)
    print(f'页面HTML已保存到: {debug_file}')
    
    # 提取图片URL
    image_urls = extract_image_urls(html)
    print(f'\n找到 {len(image_urls)} 个图片URL')
    
    if len(image_urls) == 0:
        print('\n未找到图片URL')
        print('提示:')
        print('1. 微信公众号文章可能需要登录才能查看')
        print('2. 图片可能是通过JavaScript动态加载的')
        print('3. 建议使用浏览器开发者工具手动提取图片URL')
        print('\n您可以在浏览器中：')
        print('1. 打开开发者工具 (F12)')
        print('2. 切换到Network标签')
        print('3. 刷新页面')
        print('4. 筛选Image类型')
        print('5. 找到图片URL并手动下载')
        return
    
    # 显示找到的URL
    print('\n找到的图片URL:')
    for i, url in enumerate(image_urls, 1):
        print(f'{i}. {url}')
    
    # 下载图片
    print(f'\n开始下载图片到: {OUTPUT_DIR}')
    success_count = 0
    fail_count = 0
    
    for i, url in enumerate(image_urls, 1):
        filename = get_filename_from_url(url)
        filepath = OUTPUT_DIR / filename
        
        # 如果文件已存在，跳过
        if filepath.exists():
            print(f'[{i}/{len(image_urls)}] 跳过已存在的文件: {filename}')
            continue
        
        print(f'[{i}/{len(image_urls)}] 下载中: {filename}')
        if download_image(url, filepath):
            # 检查文件大小，如果太小可能是错误页面
            size = filepath.stat().st_size
            if size < 1024:  # 小于1KB可能是错误
                filepath.unlink()
                print(f'  文件太小，可能下载失败，已删除')
                fail_count += 1
            else:
                print(f'  成功 ({size/1024:.1f} KB)')
                success_count += 1
        else:
            fail_count += 1
        
        # 延迟避免请求过快
        import time
        time.sleep(0.5)
    
    print(f'\n下载完成！成功: {success_count}, 失败: {fail_count}')
    
    if success_count > 0:
        print(f'\n图片已保存到: {OUTPUT_DIR}')
        print('您可以在应用中使用这些图片了！')


if __name__ == '__main__':
    try:
        main()
    except KeyboardInterrupt:
        print('\n\n用户中断')
        sys.exit(1)
    except Exception as e:
        print(f'\n错误: {e}')
        import traceback
        traceback.print_exc()
        sys.exit(1)

