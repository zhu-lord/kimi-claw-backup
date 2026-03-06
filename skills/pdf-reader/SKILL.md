---
name: pdf-reader
description: 全能 PDF 阅读和处理工具。支持文本提取、表格提取、图片提取、元数据读取、页面渲染、文本搜索等功能。当用户需要读取、解析或处理 PDF 文件时使用此 skill。
---

# PDF 全能阅读/处理 Skill

此 Skill 提供对 PDF 文件的全面处理能力，基于 PyMuPDF 和 pdfplumber 两个强大的 Python 库。

## 功能特性

| 功能 | 描述 | 使用场景 |
|------|------|----------|
| **文本提取** | 提取 PDF 文本内容，支持保留布局 | 阅读、分析、索引 |
| **表格提取** | 精确提取表格数据为结构化格式 | 数据分析、导入 Excel |
| **图片提取** | 提取内嵌图片并保存 | 素材收集、图片归档 |
| **元数据读取** | 读取标题、作者、创建日期等 | 文档管理、分类归档 |
| **页面渲染** | 将 PDF 转为 PNG/JPG 图片 | 预览、缩略图生成 |
| **文本搜索** | 在 PDF 中搜索关键词 | 快速定位内容 |
| **文档摘要** | 生成文档概览信息 | 快速了解文档内容 |

## 依赖安装

```bash
pip install pymupdf pdfplumber
```

## 使用方式

### 脚本位置

主脚本：`scripts/pdf_handler.py`

### 命令行用法

#### 1. 提取文本
```bash
# 提取全部文本
python3 scripts/pdf_handler.py text --input document.pdf

# 提取指定页面（第1-3页）
python3 scripts/pdf_handler.py text --input document.pdf --pages 0-2

# 提取指定页面（第1页和第3页）
python3 scripts/pdf_handler.py text --input document.pdf --pages 0,2

# 不保留布局（纯文本）
python3 scripts/pdf_handler.py text --input document.pdf --no-layout
```

#### 2. 提取表格
```bash
# 提取所有表格
python3 scripts/pdf_handler.py tables --input document.pdf

# 提取指定页面的表格
python3 scripts/pdf_handler.py tables --input document.pdf --pages 0-5
```

#### 3. 提取图片
```bash
# 提取图片并保存到目录
python3 scripts/pdf_handler.py images --input document.pdf --output ./images/

# 提取指定页面的图片
python3 scripts/pdf_handler.py images --input document.pdf --output ./images/ --pages 0,1
```

#### 4. 读取元数据
```bash
python3 scripts/pdf_handler.py metadata --input document.pdf
```

#### 5. 渲染页面为图片
```bash
# 默认 150 DPI
python3 scripts/pdf_handler.py render --input document.pdf --output ./pages/

# 高分辨率 300 DPI
python3 scripts/pdf_handler.py render --input document.pdf --output ./pages/ --dpi 300

# 渲染指定页面
python3 scripts/pdf_handler.py render --input document.pdf --output ./pages/ --pages 0-4
```

#### 6. 搜索文本
```bash
python3 scripts/pdf_handler.py search --input document.pdf --keyword "关键词"

# 区分大小写
python3 scripts/pdf_handler.py search --input document.pdf --keyword "Keyword" --case-sensitive
```

#### 7. 生成摘要
```bash
python3 scripts/pdf_handler.py summary --input document.pdf
```

## 输出格式

### 文本提取输出
```json
{
  "success": true,
  "total_pages": 10,
  "pages": [
    {
      "page_number": 1,
      "text": "页面文本内容...",
      "word_count": 500,
      "links": ["https://example.com"]
    }
  ],
  "full_text": "全部文本内容..."
}
```

### 表格提取输出
```json
{
  "success": true,
  "tables": [
    {
      "page_number": 2,
      "table_index": 1,
      "data": [
        ["表头1", "表头2"],
        ["数据1", "数据2"]
      ],
      "row_count": 2,
      "col_count": 2
    }
  ]
}
```

### 图片提取输出
```json
{
  "success": true,
  "total_images": 5,
  "images": [
    {
      "page_number": 1,
      "image_index": 1,
      "extension": "png",
      "size": 12345,
      "width": 800,
      "height": 600,
      "saved_path": "./images/page1_img1.png"
    }
  ]
}
```

## 技术选型参考

| 需求场景 | 推荐工具 | 优势 |
|---------|---------|------|
| 快速文本提取 | PyMuPDF | 速度快，API简单 |
| 精确坐标定位 | pdfplumber | 支持区域裁剪，可视化调试 |
| 高性能处理 | PyMuPDF | C语言核心，速度最快 |
| 表格结构化 | pdfplumber | 识别精准，支持复杂表格 |
| 图片提取 | PyMuPDF | 支持各种图片格式 |

## 高级用法

参考 `references/advanced_usage.md` 了解：
- OCR 识别扫描件
- 批量处理多个 PDF
- 与 pandas 结合进行数据分析
- 导出到 Excel/CSV

## 限制说明

1. **扫描件 PDF**：纯图片 PDF 需要先进行 OCR 才能提取文本
2. **加密 PDF**：需要先解密才能处理
3. **复杂表格**：部分复杂布局的表格可能需要手动调整
4. **字体问题**：某些特殊字体可能导致文本提取不完整

## 故障排除

### 模块未找到
```bash
pip install pymupdf pdfplumber
```

### 中文显示问题
PyMuPDF 和 pdfplumber 都支持中文，如遇问题请检查 PDF 字体嵌入情况。

### 内存不足
大 PDF 文件建议分页处理：
```bash
# 不要一次性提取全部页面
python3 scripts/pdf_handler.py text --input large.pdf --pages 0-9
```
