---
name: office-suite
description: 通用 Office 三件套（Word/Excel/PPT）处理工具。支持 .docx/.xlsx/.pptx 文件的读取、创建、修改和内容提取。当用户需要操作 Word 文档、Excel 表格或 PowerPoint 演示文稿时使用此 skill。
---

# Office 三件套处理 Skill

此 Skill 提供对 Microsoft Office 三件套（Word、Excel、PowerPoint）的统一处理能力。

## 支持的操作

| 文件类型 | 扩展名 | 支持的操作 |
|---------|--------|-----------|
| Word | .docx | 创建、读取、修改、表格操作 |
| Excel | .xlsx, .xlsm | 创建、读取、修改、单元格操作 |
| PowerPoint | .pptx | 创建、读取、修改、幻灯片管理 |

## 依赖安装

使用前请确保已安装 Python 依赖：

```bash
pip install python-docx openpyxl python-pptx
```

## 使用方式

### 脚本位置

主脚本：`scripts/office_handler.py`

### 命令行用法

```bash
# Word - 创建文档
python3 scripts/office_handler.py --type word --action create --output report.docx \
  --data '{"content": [{"type": "heading", "text": "报告", "level": 1}, {"type": "paragraph", "text": "这是正文"}]}'

# Word - 读取文档
python3 scripts/office_handler.py --type word --action read --input report.docx

# Excel - 创建表格
python3 scripts/office_handler.py --type excel --action create --output data.xlsx \
  --data '{"sheet_name": "Sheet1", "headers": ["姓名", "年龄"], "rows": [["张三", 25], ["李四", 30]]}'

# Excel - 读取表格
python3 scripts/office_handler.py --type excel --action read --input data.xlsx

# PPT - 创建演示文稿
python3 scripts/office_handler.py --type ppt --action create --output presentation.pptx \
  --data '{"slides": [{"layout": 0, "title": "标题页", "content": "副标题"}]}'

# PPT - 读取演示文稿
python3 scripts/office_handler.py --type ppt --action read --input presentation.pptx
```

## 数据格式参考

### Word 内容结构

```json
{
  "content": [
    {"type": "heading", "text": "一级标题", "level": 1},
    {"type": "heading", "text": "二级标题", "level": 2},
    {"type": "paragraph", "text": "普通段落文本"},
    {"type": "table", "rows": 3, "cols": 2, "data": [["A", "B"], ["C", "D"], ["E", "F"]]}
  ]
}
```

### Excel 数据格式

```json
{
  "sheet_name": "工作表名称",
  "headers": ["列1", "列2", "列3"],
  "rows": [
    ["数据1", "数据2", "数据3"],
    ["数据4", "数据5", "数据6"]
  ]
}
```

### PPT 幻灯片格式

```json
{
  "slides": [
    {"layout": 0, "title": "标题幻灯片"},
    {"layout": 1, "title": "内容页", "content": "要点1\n要点2"}
  ]
}
```

## 自动文件类型检测

当不指定 `--type` 时，脚本会根据文件扩展名自动检测类型：
- `.docx` → Word
- `.xlsx`, `.xlsm` → Excel
- `.pptx` → PowerPoint

## 高级用法

### 批量处理多个文件

参考 `references/batch_examples.md` 了解批量处理模式。

### Excel 公式和样式

参考 `references/excel_advanced.md` 了解公式、图表和样式设置。

### Word 模板和样式

参考 `references/word_advanced.md` 了解模板使用和复杂格式。

## 限制说明

1. **不支持 .doc 格式**：仅支持 .docx（Word 2007+）
2. **不支持 .ppt 格式**：仅支持 .pptx（PowerPoint 2007+）
3. **宏文件**：.xlsm 可以读取但无法执行或修改宏代码
4. **复杂格式**：某些高级格式（如 Word 的修订模式）可能无法完全保留

## 故障排除

### 模块未找到

```bash
pip install python-docx openpyxl python-pptx
```

### 中文显示问题

确保系统已安装中文字体，或在代码中指定字体。

### 文件被占用

关闭正在使用该文件的 Office 应用程序后再操作。
