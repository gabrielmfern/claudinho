import { attach, type NeovimClient } from "neovim";

let client: NeovimClient | null = null;

export function getNvimClient(): NeovimClient {
  if (client) return client;

  const socketPath = process.env.NVIM;
  if (!socketPath) {
    throw new Error(
      "$NVIM environment variable not set. Claude Code must be running inside a Neovim terminal.",
    );
  }

  client = attach({ socket: socketPath });
  return client;
}
