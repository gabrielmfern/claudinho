# claudinho.nvim

MCP server that gives Claude Code access to your Neovim editor state. Connects to Neovim's built-in msgpack-RPC socket (`$NVIM`) and exposes read-only tools for querying buffers, selections, diagnostics, and window layout.

## Tools

| Tool | Description |
|------|-------------|
| `nvim_get_buffers` | List all open buffers with path, modified status, and which is current |
| `nvim_get_buffer_content` | Read lines from a buffer (defaults to current buffer) |
| `nvim_get_cursor` | Get cursor position, current file, and Vim mode |
| `nvim_get_window_layout` | Get all windows/splits with their buffers and dimensions |
| `nvim_get_visual_selection` | Get the last visual selection text and range |
| `nvim_get_diagnostics` | Get LSP diagnostics, optionally filtered by buffer or severity |

## Setup

Install dependencies and build:

```sh
pnpm install
pnpm build
```

Add to your Claude Code settings (`~/.claude.json`):

```json
{
  "mcpServers": {
    "claudinho": {
      "command": "node",
      "args": ["/absolute/path/to/claudinho/claude-code/dist/index.js"]
    }
  }
}
```

Claude Code must be launched from a Neovim `:terminal` so the `$NVIM` environment variable is available.

## Development

```sh
pnpm start        # run from source with tsx
pnpm typecheck    # type check without emitting
pnpm lint         # run biome linter
pnpm format       # auto-format with biome
pnpm build        # bundle into dist/index.js
```
