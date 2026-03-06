# PDF 处理高级用法

## OCR 识别扫描件

对于纯图片的扫描 PDF，需要结合 OCR 引擎：

```python
import fitz  # PyMuPDF
from PIL import Image
import pytesseract

def ocr_pdf_page(pdf_path, page_num=0, lang='chi_sim+eng'):
    """对 PDF 页面进行 OCR 识别"""
    doc = fitz.open(pdf_path)
    page = doc[page_num]
    
    # 将页面渲染为图片
    pix = page.get_pixmap(matrix=fitz.Matrix(2, 2))
    img_data = pix.tobytes("png")
    
    # 使用 PIL 打开
    from io import BytesIO
    img = Image.open(BytesIO(img_data))
    
    # OCR 识别
    text = pytesseract.image_to_string(img, lang=lang)
    
    doc.close()
    return text

# 批量 OCR
for page_num in range(len(doc)):
    text = ocr_pdf_page("scan.pdf", page_num)
    print(f"Page {page_num + 1}:\n{text}\n")
```

安装依赖：
```bash
pip install pytesseract pillow
# 同时需要安装 Tesseract-OCR 软件
```

## 批量处理多个 PDF

```bash
#!/bin/bash
# batch_pdf.sh

INPUT_DIR="$1"
OUTPUT_DIR="$2"
ACTION="$3"  # text, tables, images, metadata

mkdir -p "$OUTPUT_DIR"

for pdf in "$INPUT_DIR"/*.pdf; do
    [ -e "$pdf" ] || continue
    
    filename=$(basename "$pdf" .pdf)
    echo "处理: $filename"
    
    python3 scripts/pdf_handler.py "$ACTION" \
        --input "$pdf" \
        --output "$OUTPUT_DIR/${filename}.json" \
        2>/dev/null

done

echo "批量处理完成"
```

## 导出表格到 Excel

```python
import json
import pandas as pd
from openpyxl import Workbook
from openpyxl.styles import Font, PatternFill

# 读取提取的表格数据
with open('tables.json', 'r') as f:
    data = json.load(f)

# 创建 Excel 文件
wb = Workbook()
wb.remove(wb.active)  # 删除默认 sheet

for idx, table in enumerate(data['tables'], 1):
    ws = wb.create_sheet(f"Table_{idx}")
    
    # 写入数据
    for row_idx, row in enumerate(table['data'], 1):
        for col_idx, cell in enumerate(row, 1):
            ws.cell(row=row_idx, column=col_idx, value=cell)
    
    # 格式化表头
    for cell in ws[1]:
        cell.font = Font(bold=True)
        cell.fill = PatternFill(start_color="CCCCCC", end_color="CCCCCC", fill_type="solid")

wb.save('output.xlsx')
```

## 文本分析与关键词提取

```python
import json
import jieba
import jieba.analyse
from collections import Counter

# 读取提取的文本
with open('text.json', 'r') as f:
    data = json.load(f)

full_text = data['full_text']

# 中文分词
words = jieba.lcut(full_text)

# 过滤停用词和短词
filtered = [w for w in words if len(w) > 1 and w.strip()]

# 统计词频
word_freq = Counter(filtered).most_common(20)
print("Top 20 关键词:")
for word, count in word_freq:
    print(f"  {word}: {count}")

# TF-IDF 提取关键词
keywords = jieba.analyse.extract_tags(full_text, topK=10, withWeight=True)
print("\nTF-IDF 关键词:")
for word, weight in keywords:
    print(f"  {word}: {weight:.4f}")
```

## PDF 合并与拆分

```python
import fitz

def merge_pdfs(pdf_list, output_path):
    """合并多个 PDF"""
    result = fitz.open()
    
    for pdf_path in pdf_list:
        doc = fitz.open(pdf_path)
        result.insert_pdf(doc)
        doc.close()
    
    result.save(output_path)
    result.close()

def split_pdf(pdf_path, output_prefix, pages_per_file=10):
    """按页数拆分 PDF"""
    doc = fitz.open(pdf_path)
    total_pages = len(doc)
    
    for start in range(0, total_pages, pages_per_file):
        end = min(start + pages_per_file, total_pages)
        
        new_doc = fitz.open()
        new_doc.insert_pdf(doc, from_page=start, to_page=end-1)
        
        output_path = f"{output_prefix}_part{start//pages_per_file + 1}.pdf"
        new_doc.save(output_path)
        new_doc.close()
    
    doc.close()
```

## PDF 页面旋转与裁剪

```python
import fitz

def rotate_pages(pdf_path, output_path, rotation=90, pages=None):
    """旋转指定页面"""
    doc = fitz.open(pdf_path)
    
    page_range = pages if pages else range(len(doc))
    
    for page_num in page_range:
        if page_num < len(doc):
            page = doc[page_num]
            page.set_rotation(rotation)
    
    doc.save(output_path)
    doc.close()

def crop_pages(pdf_path, output_path, crop_box, pages=None):
    """裁剪页面"""
    doc = fitz.open(pdf_path)
    
    page_range = pages if pages else range(len(doc))
    
    for page_num in page_range:
        if page_num < len(doc):
            page = doc[page_num]
            # crop_box: (x0, y0, x1, y1)
            page.set_cropbox(fitz.Rect(crop_box))
    
    doc.save(output_path)
    doc.close()
```

## PDF 添加水印

```python
import fitz

def add_watermark(pdf_path, output_path, watermark_text="CONFIDENTIAL"):
    """添加文字水印"""
    doc = fitz.open(pdf_path)
    
    for page in doc:
        # 在页面中心添加半透明水印
        rect = page.rect
        center = (rect.width / 2, rect.height / 2)
        
        text_writer = fitz.TextWriter(page.rect)
        text_writer.append(center, watermark_text, fontsize=50)
        
        page.write_text(text_writer, color=(0.8, 0.8, 0.8), overlay=True)
    
    doc.save(output_path)
    doc.close()
```

## 性能优化

### 大文件处理
```python
# 使用生成器逐页处理，避免内存溢出
def process_large_pdf(pdf_path, callback):
    """逐页处理大 PDF"""
    doc = fitz.open(pdf_path)
    
    try:
        for page_num in range(len(doc)):
            page = doc[page_num]
            result = callback(page, page_num)
            yield result
            
            # 定期清理缓存
            if page_num % 10 == 0:
                doc._delete_page_text_cache(page_num)
    finally:
        doc.close()

# 使用示例
for result in process_large_pdf("large.pdf", lambda p, n: p.get_text()):
    process_result(result)
```

### 并行处理
```python
from concurrent.futures import ProcessPoolExecutor
import fitz

def extract_page_text(args):
    """提取单页文本（用于多进程）"""
    pdf_path, page_num = args
    doc = fitz.open(pdf_path)
    page = doc[page_num]
    text = page.get_text()
    doc.close()
    return page_num, text

def parallel_extract(pdf_path, max_workers=4):
    """并行提取所有页面"""
    doc = fitz.open(pdf_path)
    total_pages = len(doc)
    doc.close()
    
    args_list = [(pdf_path, i) for i in range(total_pages)]
    
    with ProcessPoolExecutor(max_workers=max_workers) as executor:
        results = list(executor.map(extract_page_text, args_list))
    
    # 按页码排序
    results.sort(key=lambda x: x[0])
    return [text for _, text in results]
```
