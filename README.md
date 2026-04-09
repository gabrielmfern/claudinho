Most plugins for claude code in neovim are really just one single thing, they run claude code inside of a terminal session. I find this bad for two of reasons personally:
- The terminal buffer is not as capable as actual terminal, or even as tmux
- Having to write some command to mention code in Claude Code is not a very good expereicen, and then you need yet another shortcut


So this is Opus's attempt at a better experience for this. It includes a Claude Code plugin that can be installed, and it will communicate with the neovim plugin. The neovim plugin will exist as a tool that Claude can access whatever is the state of your neovim. That means, splits, buffers open, selection, draft code, etc.

This is borrowing from the idea that [amp.nvim](https://github.com/sourcegraph/amp.nvim) implements, which I believe is now discontinued, and it was used as a basis for this project.

## Installation

### Prerequisites

- Neovim
- Node.js
- [pnpm](https://pnpm.io)

### Setup

1. Clone the repository and install dependencies:

```sh
git clone https://github.com/your-user/claudinho.git
cd claudinho/claude-code
pnpm install
```

2. Add the MCP server to your Claude Code settings (`~/.claude.json`):

```json
{
  "mcpServers": {
    "claudinho": {
      "command": "npx",
      "args": ["tsx", "/absolute/path/to/claudinho/claude-code/src/index.ts"]
    }
  }
}
```

3. Launch Claude Code from inside a Neovim terminal (`:terminal`). The `$NVIM` environment variable is set automatically by Neovim, and claudinho uses it to connect via RPC.

