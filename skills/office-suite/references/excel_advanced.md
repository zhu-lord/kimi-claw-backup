# Excel 高级用法参考

## 公式支持

openpyxl 支持 Excel 公式，但不计算公式结果（只保存公式字符串）。

```python
from openpyxl import Workbook

wb = Workbook()
ws = wb.active

# 写入公式
ws['A1'] = 10
ws['A2'] = 20
ws['A3'] = '=A1+A2'

# 带函数的公式
ws['B1'] = '=SUM(A1:A2)'
ws['B2'] = '=AVERAGE(A1:A10)'

wb.save('formulas.xlsx')
```

## 样式设置

```python
from openpyxl import Workbook
from openpyxl.styles import Font, PatternFill, Alignment, Border, Side

wb = Workbook()
ws = wb.active

# 字体样式
cell = ws['A1']
cell.value = '标题'
cell.font = Font(
    name='微软雅黑',
    size=14,
    bold=True,
    color='FF0000'  # 红色
)

# 背景填充
cell.fill = PatternFill(
    start_color='FFFF00',
    end_color='FFFF00',
    fill_type='solid'
)

# 对齐方式
cell.alignment = Alignment(
    horizontal='center',
    vertical='center',
    wrap_text=True
)

# 边框
thin_border = Border(
    left=Side(style='thin'),
    right=Side(style='thin'),
    top=Side(style='thin'),
    bottom=Side(style='thin')
)
cell.border = thin_border

wb.save('styled.xlsx')
```

## 列宽和行高

```python
ws.column_dimensions['A'].width = 20
ws.row_dimensions[1].height = 30
```

## 图表创建

```python
from openpyxl.chart import BarChart, Reference

# 创建柱状图
chart = BarChart()
chart.type = 'col'
chart.title = '销售数据'
chart.x_axis.title = '月份'
chart.y_axis.title = '销售额'

data = Reference(ws, min_col=2, min_row=1, max_row=7, max_col=2)
categories = Reference(ws, min_col=1, min_row=2, max_row=7)

chart.add_data(data, titles_from_data=True)
chart.set_categories(categories)

ws.add_chart(chart, 'E2')
```

## 多工作表操作

```python
# 创建新工作表
ws1 = wb.create_sheet('数据1')
ws2 = wb.create_sheet('数据2', 0)  # 插入到第一位

# 复制工作表
ws_copy = wb.copy_worksheet(ws1)
ws_copy.title = '数据副本'

# 删除工作表
del wb['数据2']
```

## 数据验证（下拉列表）

```python
from openpyxl.worksheet.datavalidation import DataValidation

dv = DataValidation(
    type='list',
    formula1='"选项1,选项2,选项3"',
    allow_blank=True
)
ws.add_data_validation(dv)
dv.add('A1:A10')
```

## 条件格式

```python
from openpyxl.formatting.rule import ColorScaleRule

# 色阶规则
color_scale = ColorScaleRule(
    start_type='min',
    start_color='63BE7B',      # 绿色
    mid_type='percentile',
    mid_value=50,
    mid_color='FFEB84',        # 黄色
    end_type='max',
    end_color='F8696B'         # 红色
)
ws.conditional_formatting.add('B2:M30', color_scale)
```

## 读取大数据优化

```python
# 只读取数据，不读取公式结果（更快）
wb = load_workbook('large.xlsx', data_only=True, read_only=True)

# 迭代读取（内存友好）
for row in ws.iter_rows(min_row=2, values_only=True):
    print(row)
```
