---
"claudinho.nvim": minor
---

Initial release of the Claude Code MCP plugin for Neovim integration.

- MCP server that connects to Neovim via the `$NVIM` msgpack-RPC socket
- Read-only tools: `nvim_get_buffers`, `nvim_get_buffer_content`, `nvim_get_cursor`, `nvim_get_window_layout`, `nvim_get_visual_selection`, `nvim_get_diagnostics`
- Single-file bundle via tsdown, executable via `npx claudinho.nvim`
