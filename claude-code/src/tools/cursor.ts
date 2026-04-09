import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { getNvimClient } from "../nvim-client.js";

export function registerCursorTools(server: McpServer) {
  server.registerTool(
    "nvim_get_cursor",
    {
      description: "Get the current cursor position, file, and Vim mode",
    },
    async () => {
      const nvim = getNvimClient();
      const [win, mode] = await Promise.all([nvim.window, nvim.mode]);
      const [buf, cursor] = await Promise.all([win.buffer, win.cursor]);
      const name = await buf.name;

      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify(
              {
                bufnr: buf.id,
                file: name,
                line: cursor[0],
                col: cursor[1],
                mode: mode.mode,
              },
              null,
              2,
            ),
          },
        ],
      };
    },
  );

  server.registerTool(
    "nvim_get_window_layout",
    {
      description:
        "Get all windows/splits with their buffers, cursor positions, and dimensions",
    },
    async () => {
      const nvim = getNvimClient();
      const windows = await nvim.windows;

      const result = await Promise.all(
        windows.map(async (win) => {
          const [buf, cursor, height, width, position] = await Promise.all([
            win.buffer,
            win.cursor,
            win.height,
            win.width,
            win.position,
          ]);
          const name = await buf.name;

          return {
            windowId: win.id,
            bufnr: buf.id,
            file: name,
            cursor: { line: cursor[0], col: cursor[1] },
            height,
            width,
            position: { row: position[0], col: position[1] },
          };
        }),
      );

      return {
        content: [
          { type: "text" as const, text: JSON.stringify(result, null, 2) },
        ],
      };
    },
  );
}
