# Word 高级用法参考

## 文本格式设置

```python
from docx import Document
from docx.shared import Pt, RGBColor, Inches
from docx.enum.text import WD_ALIGN_PARAGRAPH

doc = Document()

# 添加带格式的段落
p = doc.add_paragraph()

# 添加不同格式的文本片段
run1 = p.add_run('普通文本 ')
run2 = p.add_run('加粗文本 ')
run2.bold = True
run3 = p.add_run('斜体文本 ')
run3.italic = True
run4 = p.add_run('红色文本')
run4.font.color.rgb = RGBColor(255, 0, 0)
run4.font.size = Pt(16)

# 段落对齐
p.alignment = WD_ALIGN_PARAGRAPH.CENTER

# 行间距
p.paragraph_format.line_spacing = 1.5

# 段前段后间距
p.paragraph_format.space_before = Pt(12)
p.paragraph_format.space_after = Pt(12)
```

## 图片插入

```python
# 插入图片
doc.add_picture('image.png', width=Inches(2.5))

# 居中图片
last_paragraph = doc.paragraphs[-1]
last_paragraph.alignment = WD_ALIGN_PARAGRAPH.CENTER
```

## 表格高级操作

```python
# 创建表格
table = doc.add_table(rows=3, cols=3)
table.style = 'Light Grid Accent 1'

# 设置表头
header_cells = table.rows[0].cells
header_cells[0].text = '姓名'
header_cells[1].text = '部门'
header_cells[2].text = '薪资'

# 设置表头背景色
for cell in header_cells:
    cell.paragraphs[0].runs[0].font.bold = True

# 合并单元格
table.cell(0, 0).merge(table.cell(0, 1))

# 添加行
row = table.add_row()
row.cells[0].text = '新员工'
```

## 页眉页脚

```python
from docx.enum.section import WD_ORIENT

# 获取节（section）
section = doc.sections[0]

# 页眉
header = section.header
header_para = header.paragraphs[0]
header_para.text = '公司机密'
header_para.alignment = WD_ALIGN_PARAGRAPH.CENTER

# 页脚（页码）
footer = section.footer
footer_para = footer.paragraphs[0]
footer_para.text = '第 页'

# 页面方向
section.orientation = WD_ORIENT.LANDSCAPE  # 横向
section.page_width = Inches(11)
section.page_height = Inches(8.5)
```

## 列表（项目符号和编号）

```python
# 项目符号列表
doc.add_paragraph('项目1', style='List Bullet')
doc.add_paragraph('项目2', style='List Bullet')
doc.add_paragraph('项目3', style='List Bullet')

# 编号列表
doc.add_paragraph('步骤1', style='List Number')
doc.add_paragraph('步骤2', style='List Number')
doc.add_paragraph('步骤3', style='List Number')
```

## 使用模板

```python
# 基于模板创建
doc = Document('template.docx')

# 替换占位符
for para in doc.paragraphs:
    if '{{NAME}}' in para.text:
        para.text = para.text.replace('{{NAME}}', '张三')
    if '{{DATE}}' in para.text:
        para.text = para.text.replace('{{DATE}}', '2024-01-01')

# 替换表格中的占位符
for table in doc.tables:
    for row in table.rows:
        for cell in row.cells:
            if '{{COMPANY}}' in cell.text:
                cell.text = cell.text.replace('{{COMPANY}}', 'ABC公司')
```

## 提取所有文本

```python
def get_full_text(doc):
    """提取文档中所有文本"""
    full_text = []
    
    # 段落文本
    for para in doc.paragraphs:
        full_text.append(para.text)
    
    # 表格文本
    for table in doc.tables:
        for row in table.rows:
            row_text = [cell.text for cell in row.cells]
            full_text.append(' | '.join(row_text))
    
    return '\n'.join(full_text)
```

## 样式应用

```python
# 内置样式
doc.add_paragraph('标题', style='Title')
doc.add_paragraph('一级标题', style='Heading 1')
doc.add_paragraph('二级标题', style='Heading 2')
doc.add_paragraph('引用', style='Quote')
doc.add_paragraph('代码', style='Intense Quote')

# 自定义样式
from docx.enum.style import WD_STYLE_TYPE

styles = doc.styles
style = styles.add_style('CustomStyle', WD_STYLE_TYPE.PARAGRAPH)
style.font.name = '微软雅黑'
style.font.size = Pt(12)

p = doc.add_paragraph('自定义样式文本', style='CustomStyle')
```
