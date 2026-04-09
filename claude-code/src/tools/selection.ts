import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { getNvimClient } from "../nvim-client.js";

const GET_SELECTION_LUA = `
local buf = vim.api.nvim_get_current_buf()
local start_pos = vim.fn.getpos("'<")
local end_pos = vim.fn.getpos("'>")

if start_pos[2] == 0 and end_pos[2] == 0 then
  return vim.json.encode({ hasSelection = false })
end

local start_line = start_pos[2] - 1
local start_col = start_pos[3] - 1
local end_line = end_pos[2] - 1
local end_col = end_pos[3]

local lines = vim.api.nvim_buf_get_text(buf, start_line, start_col, end_line, end_col, {})
local name = vim.api.nvim_buf_get_name(buf)

return vim.json.encode({
  hasSelection = true,
  bufnr = buf,
  file = name,
  startLine = start_pos[2],
  startCol = start_pos[3],
  endLine = end_pos[2],
  endCol = end_pos[3],
  text = table.concat(lines, "\\n"),
})
`;

export function registerSelectionTools(server: McpServer) {
  server.registerTool(
    "nvim_get_visual_selection",
    {
      description: "Get the current or last visual selection text and range",
    },
    async () => {
      const nvim = getNvimClient();
      const raw = (await nvim.lua(GET_SELECTION_LUA, [])) as string;
      const result = JSON.parse(raw);

      return {
        content: [
          { type: "text" as const, text: JSON.stringify(result, null, 2) },
        ],
      };
    },
  );
}
