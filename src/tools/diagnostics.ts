import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { getNvimClient } from "../nvim-client.js";

const SEVERITY_MAP: Record<string, number> = {
  error: 1,
  warn: 2,
  info: 3,
  hint: 4,
};

const SEVERITY_NAMES = ["", "error", "warn", "info", "hint"];

const GET_DIAGNOSTICS_LUA = `
local bufnr, severity = ...
if bufnr == 0 then bufnr = nil end
if severity == 0 then severity = nil end
local opts = {}
if severity then opts.severity = severity end
local diags = vim.diagnostic.get(bufnr, opts)
local results = {}
for _, d in ipairs(diags) do
  table.insert(results, {
    bufnr = d.bufnr,
    file = vim.api.nvim_buf_get_name(d.bufnr),
    line = d.lnum + 1,
    col = d.col + 1,
    message = d.message,
    severity = d.severity,
    source = d.source or "",
  })
end
return vim.json.encode(results)
`;

export function registerDiagnosticsTools(server: McpServer) {
  server.registerTool(
    "nvim_get_diagnostics",
    {
      description:
        "Get LSP diagnostics (errors, warnings, etc.) for a buffer or all buffers",
      inputSchema: {
        bufnr: z
          .number()
          .optional()
          .describe("Buffer number. Omit for all buffers."),
        severity: z
          .enum(["error", "warn", "info", "hint"])
          .optional()
          .describe("Filter by severity level"),
      },
    },
    async ({ bufnr, severity }) => {
      const nvim = getNvimClient();
      const severityNum = severity ? SEVERITY_MAP[severity] : 0;
      const raw = (await nvim.lua(GET_DIAGNOSTICS_LUA, [
        bufnr ?? 0,
        severityNum,
      ])) as string;
      const diags = JSON.parse(raw) as Array<{
        severity: number;
        [key: string]: unknown;
      }>;

      const result = diags.map((d) => ({
        ...d,
        severity: SEVERITY_NAMES[d.severity] || String(d.severity),
      }));

      return {
        content: [
          { type: "text" as const, text: JSON.stringify(result, null, 2) },
        ],
      };
    },
  );
}
