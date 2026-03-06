#!/usr/bin/env python3
"""
PDF 全能阅读/处理脚本
支持文本提取、表格提取、图片提取、元数据读取、页面渲染等功能
"""

import sys
import os
import json
import argparse
from pathlib import Path

def extract_text(pdf_path, pages=None, layout=True):
    """提取 PDF 文本内容"""
    try:
        import fitz  # PyMuPDF
    except ImportError:
        return {"error": "请先安装 PyMuPDF: pip install pymupdf"}
    
    try:
        doc = fitz.open(pdf_path)
        result = {
            "total_pages": len(doc),
            "pages": [],
            "full_text": ""
        }
        
        page_range = pages if pages else range(len(doc))
        
        for page_num in page_range:
            if page_num >= len(doc):
                continue
            page = doc[page_num]
            
            # 提取文本（保留布局）
            text = page.get_text("text" if not layout else "blocks")
            
            page_info = {
                "page_number": page_num + 1,
                "text": text if isinstance(text, str) else "\n\n".join([t[4] for t in text]),
                "word_count": len(page.get_text().split()),
                "links": [link["uri"] for link in page.get_links() if "uri" in link]
            }
            result["pages"].append(page_info)
            result["full_text"] += page_info["text"] + "\n\n"
        
        doc.close()
        return {"success": True, **result}
    except Exception as e:
        return {"error": str(e)}


def extract_tables(pdf_path, pages=None):
    """提取 PDF 中的表格"""
    try:
        import pdfplumber
    except ImportError:
        return {"error": "请先安装 pdfplumber: pip install pdfplumber"}
    
    try:
        result = {"tables": []}
        
        with pdfplumber.open(pdf_path) as pdf:
            page_range = pages if pages else range(len(pdf.pages))
            
            for page_num in page_range:
                if page_num >= len(pdf.pages):
                    continue
                page = pdf.pages[page_num]
                tables = page.extract_tables()
                
                for idx, table in enumerate(tables):
                    result["tables"].append({
                        "page_number": page_num + 1,
                        "table_index": idx + 1,
                        "data": table,
                        "row_count": len(table),
                        "col_count": len(table[0]) if table else 0
                    })
        
        return {"success": True, **result}
    except Exception as e:
        return {"error": str(e)}


def extract_images(pdf_path, output_dir=None, pages=None):
    """提取 PDF 中的图片"""
    try:
        import fitz
    except ImportError:
        return {"error": "请先安装 PyMuPDF: pip install pymupdf"}
    
    try:
        doc = fitz.open(pdf_path)
        result = {"images": []}
        
        if output_dir:
            os.makedirs(output_dir, exist_ok=True)
        
        page_range = pages if pages else range(len(doc))
        img_count = 0
        
        for page_num in page_range:
            if page_num >= len(doc):
                continue
            page = doc[page_num]
            image_list = page.get_images()
            
            for img_index, img in enumerate(image_list):
                xref = img[0]
                base_image = doc.extract_image(xref)
                image_bytes = base_image["image"]
                image_ext = base_image["ext"]
                
                img_info = {
                    "page_number": page_num + 1,
                    "image_index": img_index + 1,
                    "extension": image_ext,
                    "size": len(image_bytes),
                    "width": img[2],
                    "height": img[3]
                }
                
                if output_dir:
                    img_path = f"{output_dir}/page{page_num+1}_img{img_index+1}.{image_ext}"
                    with open(img_path, "wb") as f:
                        f.write(image_bytes)
                    img_info["saved_path"] = img_path
                
                result["images"].append(img_info)
                img_count += 1
        
        doc.close()
        result["total_images"] = img_count
        return {"success": True, **result}
    except Exception as e:
        return {"error": str(e)}


def get_metadata(pdf_path):
    """获取 PDF 元数据"""
    try:
        import fitz
    except ImportError:
        return {"error": "请先安装 PyMuPDF: pip install pymupdf"}
    
    try:
        doc = fitz.open(pdf_path)
        metadata = doc.metadata
        result = {
            "success": True,
            "total_pages": len(doc),
            "metadata": {
                "title": metadata.get("title", ""),
                "author": metadata.get("author", ""),
                "subject": metadata.get("subject", ""),
                "creator": metadata.get("creator", ""),
                "producer": metadata.get("producer", ""),
                "creation_date": metadata.get("creationDate", ""),
                "modification_date": metadata.get("modDate", ""),
                "format": metadata.get("format", ""),
                "encrypted": metadata.get("encryption", None) is not None
            }
        }
        doc.close()
        return result
    except Exception as e:
        return {"error": str(e)}


def render_pages(pdf_path, output_dir, pages=None, dpi=150):
    """将 PDF 页面渲染为图片"""
    try:
        import fitz
    except ImportError:
        return {"error": "请先安装 PyMuPDF: pip install pymupdf"}
    
    try:
        doc = fitz.open(pdf_path)
        os.makedirs(output_dir, exist_ok=True)
        result = {"rendered_pages": []}
        
        page_range = pages if pages else range(len(doc))
        
        for page_num in page_range:
            if page_num >= len(doc):
                continue
            page = doc[page_num]
            
            # 设置缩放矩阵
            mat = fitz.Matrix(dpi/72, dpi/72)
            pix = page.get_pixmap(matrix=mat)
            
            output_path = f"{output_dir}/page_{page_num+1:04d}.png"
            pix.save(output_path)
            
            result["rendered_pages"].append({
                "page_number": page_num + 1,
                "output_path": output_path,
                "width": pix.width,
                "height": pix.height,
                "dpi": dpi
            })
        
        doc.close()
        return {"success": True, **result}
    except Exception as e:
        return {"error": str(e)}


def search_text(pdf_path, keyword, case_sensitive=False):
    """在 PDF 中搜索文本"""
    try:
        import fitz
    except ImportError:
        return {"error": "请先安装 PyMuPDF: pip install pymupdf"}
    
    try:
        doc = fitz.open(pdf_path)
        result = {"matches": [], "total_matches": 0}
        
        for page_num in range(len(doc)):
            page = doc[page_num]
            text_instances = page.search_for(keyword, case=case_sensitive)
            
            for inst in text_instances:
                result["matches"].append({
                    "page_number": page_num + 1,
                    "rect": [inst.x0, inst.y0, inst.x1, inst.y1],
                    "context": page.get_textbox(inst).strip()[:100]
                })
        
        result["total_matches"] = len(result["matches"])
        doc.close()
        return {"success": True, **result}
    except Exception as e:
        return {"error": str(e)}


def summarize_pdf(pdf_path, max_pages=5):
    """生成 PDF 摘要（提取前几页的关键信息）"""
    result = extract_text(pdf_path, pages=range(min(max_pages, 10)))
    
    if "error" in result:
        return result
    
    summary = {
        "success": True,
        "total_pages": result["total_pages"],
        "sampled_pages": len(result["pages"]),
        "title_preview": result["pages"][0]["text"][:200] if result["pages"] else "",
        "word_count": sum(p["word_count"] for p in result["pages"]),
        "has_links": any(p["links"] for p in result["pages"]),
        "estimated_reading_time": sum(p["word_count"] for p in result["pages"]) // 200  # 200 wpm
    }
    
    return summary


def main():
    parser = argparse.ArgumentParser(description="PDF 全能阅读/处理工具")
    parser.add_argument("action", choices=[
        "text", "tables", "images", "metadata", "render", "search", "summary"
    ], help="操作类型")
    parser.add_argument("--input", "-i", required=True, help="输入 PDF 文件路径")
    parser.add_argument("--output", "-o", help="输出目录或文件路径")
    parser.add_argument("--pages", "-p", help="指定页面，如: 0,1,2 或 0-5")
    parser.add_argument("--keyword", "-k", help="搜索关键词（search 操作使用）")
    parser.add_argument("--dpi", type=int, default=150, help="渲染 DPI (默认 150)")
    parser.add_argument("--no-layout", action="store_true", help="不保留文本布局")
    
    args = parser.parse_args()
    
    # 解析页面范围
    pages = None
    if args.pages:
        pages = []
        for part in args.pages.split(","):
            if "-" in part:
                start, end = map(int, part.split("-"))
                pages.extend(range(start, end + 1))
            else:
                pages.append(int(part))
    
    # 路由到对应的功能
    if args.action == "text":
        result = extract_text(args.input, pages, layout=not args.no_layout)
    elif args.action == "tables":
        result = extract_tables(args.input, pages)
    elif args.action == "images":
        result = extract_images(args.input, args.output, pages)
    elif args.action == "metadata":
        result = get_metadata(args.input)
    elif args.action == "render":
        if not args.output:
            print(json.dumps({"error": "render 操作需要指定 --output 目录"}, ensure_ascii=False))
            sys.exit(1)
        result = render_pages(args.input, args.output, pages, args.dpi)
    elif args.action == "search":
        if not args.keyword:
            print(json.dumps({"error": "search 操作需要指定 --keyword"}, ensure_ascii=False))
            sys.exit(1)
        result = search_text(args.input, args.keyword)
    elif args.action == "summary":
        result = summarize_pdf(args.input)
    else:
        result = {"error": f"未知的操作: {args.action}"}
    
    print(json.dumps(result, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
