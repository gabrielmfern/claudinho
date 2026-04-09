# claudinho-nvim

Most plugins for claude code in neovim are really just one single thing, they run claude code inside of a terminal session. I find this bad for two of reasons personally:
- The terminal buffer is not as capable as actual terminal, or even as tmux
- Having to write some command to mention code in Claude Code is not a very good expereicen, and then you need yet another shortcut

So this is Opus's attempt at a better experience for this. It includes a Claude Code plugin that can be installed, and it will communicate with the neovim plugin. The neovim plugin will exist as a tool that Claude can access whatever is the state of your neovim. That means, splits, buffers open, selection, draft code, etc.

This is borrowing from the idea that [amp.nvim](https://github.com/sourcegraph/amp.nvim) implements, which I believe is now discontinued, and it was used as a basis for this project.

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
      "command": "npx -y",
      "args": ["claudinho-nvim"]
    }
  }
}
```

Claude Code must be launched from a Neovim `:terminal` so the `$NVIM` environment variable is available.

## Development

```sh
pnpm start        # run from source with tsx
pnpm build        # bundle into dist/index.js
pnpm typecheck    # type check without emitting
pnpm lint         # run biome linter
pnpm lint:fix     # auto-fix lint issues
pnpm version      # bump version from changesets
pnpm release      # build and publish to npm
```
