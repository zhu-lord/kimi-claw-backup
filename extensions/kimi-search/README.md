# Kimi Search OpenClaw Plugin

Single OpenClaw plugin that combines Kimi Code search and fetch tools:

- `kimi_search`
- `kimi_fetch`

## Install (local dev path)

```bash
openclaw plugins install -l /Users/chenxinhao/Documents/kimi-cli/examples/openclaw-kimicode-web-plugin
openclaw plugins enable kimi-search
```

Then restart the OpenClaw Gateway.

## Required env

```bash
export KIMI_CODE_API_KEY="<your-key>"
```

Both tools in this plugin use the same `KIMI_CODE_API_KEY`.

## Testing

See `/Users/chenxinhao/Documents/kimi-cli/examples/openclaw-kimicode-web-plugin/TESTING.md`.

## Minimal config

```json5
{
  plugins: {
    entries: {
      "kimi-search": {
        enabled: true
      }
    }
  }
}
```

## Tool Parameters

### `kimi_search`

- `query` (string, required)
- `limit` (int, optional, 1-20, default 5)
- `include_content` (boolean, optional, default `false`)

### `kimi_fetch`

- `url` (string, required)
