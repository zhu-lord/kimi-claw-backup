---
name: image-generation
description: AI图像生成工具。当用户需要生成图片、创建图像、AI绘画时使用此skill。支持多种AI图像生成服务（OpenAI DALL-E、Stability AI、Fal.ai等）。
---

# 图像生成 Skill

此 Skill 提供统一的 AI 图像生成能力，支持多种主流图像生成服务。

## 支持的图像生成服务

| 服务 | 特点 | 需要配置 |
|------|------|----------|
| **OpenAI DALL-E 3** | 质量高，理解力强 | OPENAI_API_KEY |
| **Labnana** | 国内可用，速度快 | OPENAI_API_KEY + OPENAI_BASE_URL |
| **Stability AI** | 速度快，价格低 | STABILITY_API_KEY |
| **Fal.ai** | 模型多，效果好 | FAL_KEY |
| **Pollinations** | 免费，无需API Key | 无需配置 |

## 依赖安装

```bash
pip install openai requests pillow
```

## 配置 API Key

选择一种方式配置：

### 方式1：环境变量
```bash
# OpenAI 官方
export OPENAI_API_KEY="sk-xxx"

# Labnana (国内镜像)
export OPENAI_API_KEY="lh_sk_xxx"
export OPENAI_BASE_URL="https://api.labnana.com/v1"

# 其他服务
export STABILITY_API_KEY="sk-xxx"
export FAL_KEY="xxx"
```

### 方式2：配置文件
创建 `~/.openclaw/image-gen-config.json`:
```json
{
  "provider": "openai",
  "api_key": "sk-xxx"
}
```

## 使用方式

### 脚本位置
主脚本：`scripts/generate.py`

### 命令行用法

```bash
# 使用 OpenAI DALL-E 3
python3 scripts/generate.py \
  --provider openai \
  --prompt "一只可爱的猫在草地上玩耍" \
  --output cat.png \
  --size 1024x1024

# 使用 Labnana (国内)
export OPENAI_API_KEY="lh_sk_xxx"
export OPENAI_BASE_URL="https://api.labnana.com/v1"
python3 scripts/generate.py \
  --provider openai \
  --prompt "一只红色的卡通龙虾在白色背景上" \
  --output lobster.png \
  --model gpt-4o-image

# 使用 Stability AI
python3 scripts/generate.py \
  --provider stability \
  --prompt "未来城市景观，赛博朋克风格" \
  --output city.png \
  --size 1024x1024

# 使用 Fal.ai
python3 scripts/generate.py \
  --provider fal \
  --prompt "山水画风格的中国古代庭院" \
  --output garden.png \
  --model flux-pro

# 使用 Pollinations（免费）
python3 scripts/generate.py \
  --provider pollinations \
  --prompt "一只龙虾在月球上" \
  --output lobster.png
```

### 参数说明

| 参数 | 说明 | 默认值 |
|------|------|--------|
| `--provider` | 服务提供商: openai/stability/fal/pollinations | openai |
| `--prompt` | 图像描述提示词（必需） | - |
| `--output` | 输出文件路径 | generated.png |
| `--size` | 图像尺寸 | 1024x1024 |
| `--model` | 特定模型名称 | 提供商默认 |
| `--reference-images` | 参考图像路径（用于风格一致） | - |

## 提示词技巧

### 通用公式
```
[主体] + [细节] + [风格] + [光线] + [构图] + [质量]
```

### 示例

**基础提示词：**
```
一只金毛犬在公园里奔跑
```

**优化提示词：**
```
一只金毛寻回犬在阳光明媚的公园里奔跑，毛发金光闪闪，背景是绿草地和蓝天，写实摄影风格，高清细节，专业摄影
```

**风格化提示词：**
```
未来城市景观，霓虹灯闪烁，赛博朋克风格，雨中街道，电影级光照，8K超清，概念艺术
```

### 风格关键词

| 风格 | 关键词 |
|------|--------|
| 写实摄影 | photorealistic, professional photography, DSLR |
| 动漫 | anime style, manga, studio ghibli |
| 油画 | oil painting, classical art, impressionist |
| 水彩 | watercolor, soft, dreamy |
| 赛博朋克 | cyberpunk, neon, futuristic |
| 像素风 | pixel art, retro game, 8-bit |

## 故障排除

### API Key 错误
```
Error: API key not found
```
**解决**: 检查环境变量或配置文件是否正确设置

### 网络连接错误
```
Error: Connection failed
```
**解决**: 检查网络连接，考虑使用代理

### 提示词被拒
```
Error: Content policy violation
```
**解决**: 修改提示词，避免敏感内容

## 成本参考

| 服务 | 价格 | 特点 |
|------|------|------|
| OpenAI DALL-E 3 | $0.04-0.08/张 | 质量最高 |
| Stability AI | $0.01-0.02/张 | 性价比高 |
| Fal.ai | 按模型定价 | 模型丰富 |
| Pollinations | 免费 | 质量一般 |
