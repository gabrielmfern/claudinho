#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { attach } from "neovim";
//#region src/nvim-client.ts
let client = null;
function getNvimClient() {
	if (client) return client;
	const socketPath = process.env.NVIM;
	if (!socketPath) throw new Error("$NVIM environment variable not set. Claude Code must be running inside a Neovim terminal.");
	client = attach({ socket: socketPath });
	return client;
}
//#endregion
//#region src/tools/buffers.ts
function registerBufferTools(server) {
	server.registerTool("nvim_get_buffers", { description: "List all open buffers in Neovim with metadata" }, async () => {
		const nvim = getNvimClient();
		const buffers = await nvim.buffers;
		const currentBuf = await nvim.buffer;
		const result = await Promise.all(buffers.map(async (buf) => {
			const [name, loaded, modified] = await Promise.all([
				buf.name,
				buf.loaded,
				nvim.call("getbufvar", [buf.id, "&modified"])
			]);
			return {
				bufnr: buf.id,
				name,
				loaded,
				modified: modified === 1,
				current: buf.id === currentBuf.id
			};
		}));
		return { content: [{
			type: "text",
			text: JSON.stringify(result, null, 2)
		}] };
	});
	server.registerTool("nvim_get_buffer_content", {
		description: "Get the content of a buffer. Defaults to the current buffer.",
		inputSchema: {
			bufnr: z.number().optional().describe("Buffer number. Omit for current buffer."),
			startLine: z.number().optional().describe("Start line (0-indexed, inclusive)"),
			endLine: z.number().optional().describe("End line (0-indexed, exclusive)")
		}
	}, async ({ bufnr, startLine, endLine }) => {
		const nvim = getNvimClient();
		const buf = bufnr ? (await nvim.buffers).find((b) => b.id === bufnr) : await nvim.buffer;
		if (!buf) return {
			content: [{
				type: "text",
				text: `Buffer ${bufnr} not found`
			}],
			isError: true
		};
		const [name, lines] = await Promise.all([buf.name, buf.getLines({
			start: startLine ?? 0,
			end: endLine ?? -1,
			strictIndexing: false
		})]);
		return { content: [{
			type: "text",
			text: JSON.stringify({
				bufnr: buf.id,
				name,
				totalLines: lines.length,
				lines
			}, null, 2)
		}] };
	});
}
//#endregion
//#region src/tools/cursor.ts
function registerCursorTools(server) {
	server.registerTool("nvim_get_cursor", { description: "Get the current cursor position, file, and Vim mode" }, async () => {
		const nvim = getNvimClient();
		const [win, mode] = await Promise.all([nvim.window, nvim.mode]);
		const [buf, cursor] = await Promise.all([win.buffer, win.cursor]);
		const name = await buf.name;
		return { content: [{
			type: "text",
			text: JSON.stringify({
				bufnr: buf.id,
				file: name,
				line: cursor[0],
				col: cursor[1],
				mode: mode.mode
			}, null, 2)
		}] };
	});
	server.registerTool("nvim_get_window_layout", { description: "Get all windows/splits with their buffers, cursor positions, and dimensions" }, async () => {
		const windows = await getNvimClient().windows;
		const result = await Promise.all(windows.map(async (win) => {
			const [buf, cursor, height, width, position] = await Promise.all([
				win.buffer,
				win.cursor,
				win.height,
				win.width,
				win.position
			]);
			const name = await buf.name;
			return {
				windowId: win.id,
				bufnr: buf.id,
				file: name,
				cursor: {
					line: cursor[0],
					col: cursor[1]
				},
				height,
				width,
				position: {
					row: position[0],
					col: position[1]
				}
			};
		}));
		return { content: [{
			type: "text",
			text: JSON.stringify(result, null, 2)
		}] };
	});
}
//#endregion
//#region src/tools/diagnostics.ts
const SEVERITY_MAP = {
	error: 1,
	warn: 2,
	info: 3,
	hint: 4
};
const SEVERITY_NAMES = [
	"",
	"error",
	"warn",
	"info",
	"hint"
];
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
function registerDiagnosticsTools(server) {
	server.registerTool("nvim_get_diagnostics", {
		description: "Get LSP diagnostics (errors, warnings, etc.) for a buffer or all buffers",
		inputSchema: {
			bufnr: z.number().optional().describe("Buffer number. Omit for all buffers."),
			severity: z.enum([
				"error",
				"warn",
				"info",
				"hint"
			]).optional().describe("Filter by severity level")
		}
	}, async ({ bufnr, severity }) => {
		const nvim = getNvimClient();
		const severityNum = severity ? SEVERITY_MAP[severity] : 0;
		const raw = await nvim.lua(GET_DIAGNOSTICS_LUA, [bufnr ?? 0, severityNum]);
		const result = JSON.parse(raw).map((d) => ({
			...d,
			severity: SEVERITY_NAMES[d.severity] || String(d.severity)
		}));
		return { content: [{
			type: "text",
			text: JSON.stringify(result, null, 2)
		}] };
	});
}
//#endregion
//#region src/tools/selection.ts
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
function registerSelectionTools(server) {
	server.registerTool("nvim_get_visual_selection", { description: "Get the current or last visual selection text and range" }, async () => {
		const raw = await getNvimClient().lua(GET_SELECTION_LUA, []);
		const result = JSON.parse(raw);
		return { content: [{
			type: "text",
			text: JSON.stringify(result, null, 2)
		}] };
	});
}
//#endregion
//#region src/index.ts
const server = new McpServer({
	name: "claudinho",
	version: "0.1.0"
});
registerBufferTools(server);
registerCursorTools(server);
registerSelectionTools(server);
registerDiagnosticsTools(server);
const transport = new StdioServerTransport();
await server.connect(transport);
console.error("claudinho MCP server running");
//#endregion
export {};
