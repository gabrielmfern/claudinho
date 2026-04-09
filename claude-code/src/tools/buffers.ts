import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { getNvimClient } from "../nvim-client.js";

export function registerBufferTools(server: McpServer) {
  server.registerTool(
    "nvim_get_buffers",
    {
      description: "List all open buffers in Neovim with metadata",
    },
    async () => {
      const nvim = getNvimClient();
      const buffers = await nvim.buffers;
      const currentBuf = await nvim.buffer;

      const result = await Promise.all(
        buffers.map(async (buf) => {
          const [name, loaded, modified] = await Promise.all([
            buf.name,
            buf.loaded,
            nvim.call("getbufvar", [buf.id, "&modified"]) as Promise<number>,
          ]);
          return {
            bufnr: buf.id,
            name,
            loaded,
            modified: modified === 1,
            current: buf.id === currentBuf.id,
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

  server.registerTool(
    "nvim_get_buffer_content",
    {
      description:
        "Get the content of a buffer. Defaults to the current buffer.",
      inputSchema: {
        bufnr: z
          .number()
          .optional()
          .describe("Buffer number. Omit for current buffer."),
        startLine: z
          .number()
          .optional()
          .describe("Start line (0-indexed, inclusive)"),
        endLine: z
          .number()
          .optional()
          .describe("End line (0-indexed, exclusive)"),
      },
    },
    async ({ bufnr, startLine, endLine }) => {
      const nvim = getNvimClient();
      const buf = bufnr
        ? (await nvim.buffers).find((b) => b.id === bufnr)
        : await nvim.buffer;

      if (!buf) {
        return {
          content: [
            { type: "text" as const, text: `Buffer ${bufnr} not found` },
          ],
          isError: true,
        };
      }

      const [name, lines] = await Promise.all([
        buf.name,
        buf.getLines({
          start: startLine ?? 0,
          end: endLine ?? -1,
          strictIndexing: false,
        }),
      ]);

      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify(
              { bufnr: buf.id, name, totalLines: lines.length, lines },
              null,
              2,
            ),
          },
        ],
      };
    },
  );
}
