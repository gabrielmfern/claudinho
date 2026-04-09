# claudinho.nvim

## 0.2.0

### Minor Changes

- [`11abe2f`](https://github.com/gabrielmfern/claudinho/commit/11abe2feb6f3f2d7701a126e9e38027d8936143a) Thanks [@gabrielmfern](https://github.com/gabrielmfern)! - Initial release of the Claude Code MCP plugin for Neovim integration.

  - MCP server that connects to Neovim via the `$NVIM` msgpack-RPC socket
  - Read-only tools: `nvim_get_buffers`, `nvim_get_buffer_content`, `nvim_get_cursor`, `nvim_get_window_layout`, `nvim_get_visual_selection`, `nvim_get_diagnostics`
  - Single-file bundle via tsdown, executable via `npx claudinho.nvim`
