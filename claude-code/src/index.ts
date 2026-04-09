import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { registerBufferTools } from "./tools/buffers.js";
import { registerCursorTools } from "./tools/cursor.js";
import { registerDiagnosticsTools } from "./tools/diagnostics.js";
import { registerSelectionTools } from "./tools/selection.js";

const server = new McpServer({
  name: "claudinho",
  version: "0.1.0",
});

registerBufferTools(server);
registerCursorTools(server);
registerSelectionTools(server);
registerDiagnosticsTools(server);

const transport = new StdioServerTransport();
await server.connect(transport);
console.error("claudinho MCP server running");
