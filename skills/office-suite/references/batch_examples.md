# 批量处理示例

## Excel 批量生成 Word 报告

场景：根据 Excel 中的数据，为每一行生成一个 Word 文档。

```python
import json
import subprocess
from pathlib import Path

# 读取 Excel 数据
result = subprocess.run([
    'python3', 'scripts/office_handler.py',
    '--type', 'excel',
    '--action', 'read',
    '--input', 'employees.xlsx'
], capture_output=True, text=True)

data = json.loads(result.stdout)
employees = data['sheets'][0]['data'][1:]  # 跳过表头

# 为每个员工生成 Word 文档
for emp in employees:
    name, dept, salary = emp
    doc_data = {
        "content": [
            {"type": "heading", "text": f"{name} 的个人档案", "level": 1},
            {"type": "paragraph", "text": f"姓名: {name}"},
            {"type": "paragraph", "text": f"部门: {dept}"},
            {"type": "paragraph", "text": f"薪资: {salary}"},
        ]
    }
    
    subprocess.run([
        'python3', 'scripts/office_handler.py',
        '--type', 'word',
        '--action', 'create',
        '--output', f'reports/{name}_档案.docx',
        '--data', json.dumps(doc_data)
    ])
```

## 批量修改 Word 文档

场景：批量替换多个 Word 文档中的特定文本。

```python
import os
import json
import subprocess
from pathlib import Path

def batch_replace_in_docs(folder, replacements):
    """
    批量替换文件夹中所有 Word 文档的文本
    replacements: {'旧文本': '新文本'}
    """
    for docx_file in Path(folder).glob('*.docx'):
        data = {"replacements": replacements}
        
        subprocess.run([
            'python3', 'scripts/office_handler.py',
            '--type', 'word',
            '--action', 'modify',
            '--input', str(docx_file),
            '--data', json.dumps(data)
        ])
        print(f"已更新: {docx_file}")

# 使用示例
batch_replace_in_docs('./docs', {
    '2023年': '2024年',
    '旧公司名称': '新公司名称'
})
```

## Excel 数据汇总

场景：将多个 Excel 文件的数据汇总到一个文件。

```python
import json
import subprocess
from pathlib import Path

def merge_excel_files(folder, output_file):
    """合并多个 Excel 文件到一个文件"""
    all_data = []
    headers = None
    
    for xlsx_file in Path(folder).glob('*.xlsx'):
        result = subprocess.run([
            'python3', 'scripts/office_handler.py',
            '--type', 'excel',
            '--action', 'read',
            '--input', str(xlsx_file)
        ], capture_output=True, text=True)
        
        data = json.loads(result.stdout)
        sheet_data = data['sheets'][0]['data']
        
        if not headers:
            headers = sheet_data[0]
        
        all_data.extend(sheet_data[1:])  # 跳过表头
    
    # 创建汇总文件
    output_data = {
        "sheet_name": "汇总",
        "headers": headers,
        "rows": all_data
    }
    
    subprocess.run([
        'python3', 'scripts/office_handler.py',
        '--type', 'excel',
        '--action', 'create',
        '--output', output_file,
        '--data', json.dumps(output_data)
    ])

# 使用
merge_excel_files('./data', '汇总.xlsx')
```

## 从 Word 提取数据到 Excel

场景：从多个 Word 文档中提取结构化数据到 Excel。

```python
import re
import json
import subprocess
from pathlib import Path

def extract_from_docs_to_excel(folder, output_file):
    """从 Word 文档提取数据到 Excel"""
    rows = []
    
    for docx_file in Path(folder).glob('*.docx'):
        result = subprocess.run([
            'python3', 'scripts/office_handler.py',
            '--type', 'word',
            '--action', 'read',
            '--input', str(docx_file)
        ], capture_output=True, text=True)
        
        data = json.loads(result.stdout)
        full_text = data.get('full_text', '')
        
        # 使用正则提取数据
        name_match = re.search(r'姓名:\s*(.+)', full_text)
        age_match = re.search(r'年龄:\s*(\d+)', full_text)
        
        if name_match and age_match:
            rows.append([
                docx_file.stem,
                name_match.group(1).strip(),
                int(age_match.group(1))
            ])
    
    # 写入 Excel
    output_data = {
        "headers": ["文件名", "姓名", "年龄"],
        "rows": rows
    }
    
    subprocess.run([
        'python3', 'scripts/office_handler.py',
        '--type', 'excel',
        '--action', 'create',
        '--output', output_file,
        '--data', json.dumps(output_data)
    ])
```

## 生成 PPT 演示文稿

场景：根据 Excel 数据自动生成 PPT 报告。

```python
import json
import subprocess

def create_ppt_from_excel(excel_file, output_ppt):
    """根据 Excel 数据生成 PPT"""
    
    # 读取 Excel
    result = subprocess.run([
        'python3', 'scripts/office_handler.py',
        '--type', 'excel',
        '--action', 'read',
        '--input', excel_file
    ], capture_output=True, text=True)
    
    data = json.loads(result.stdout)
    sheet = data['sheets'][0]
    
    # 构建 PPT 数据
    slides = []
    
    # 标题页
    slides.append({
        "layout": 0,
        "title": sheet['name'],
        "content": f"共 {sheet['rows']} 行数据"
    })
    
    # 数据页
    headers = sheet['data'][0]
    for i, row in enumerate(sheet['data'][1:6], 1):  # 只显示前5行
        content = '\n'.join([f'{h}: {v}' for h, v in zip(headers, row)])
        slides.append({
            "layout": 1,
            "title": f"数据 {i}",
            "content": content
        })
    
    ppt_data = {"slides": slides}
    
    subprocess.run([
        'python3', 'scripts/office_handler.py',
        '--type', 'ppt',
        '--action', 'create',
        '--output', output_ppt,
        '--data', json.dumps(ppt_data)
    ])
```

## 命令行批量处理脚本

```bash
#!/bin/bash
# batch_convert.sh - 批量转换脚本

INPUT_DIR="$1"
OUTPUT_DIR="$2"
OPERATION="$3"  # read, create, modify

mkdir -p "$OUTPUT_DIR"

for file in "$INPUT_DIR"/*.{docx,xlsx,pptx}; do
    [ -e "$file" ] || continue
    
    filename=$(basename "$file")
    echo "处理: $filename"
    
    python3 scripts/office_handler.py \
        --action "$OPERATION" \
        --input "$file" \
        --output "$OUTPUT_DIR/$filename"
done

echo "批量处理完成"
```

使用：
```bash
chmod +x batch_convert.sh
./batch_convert.sh ./input ./output read
```
