import express, { Request, Response } from "express";
import * as z from "zod/v4";
import {
  McpServer,
  ResourceTemplate,
} from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";

// --- MCP server instance -----------------------------------------------------

const mcpServer = new McpServer({
  name: "my-mcp-server",
  version: "0.1.0",
});

// --- Tools -------------------------------------------------------------------

mcpServer.registerTool(
  "add_numbers",
  {
    title: "Add Numbers",
    description: "Add two numbers and return the sum.",
    inputSchema: {
      a: z.number().describe("The first number to add"),
      b: z.number().describe("The second number to add"),
    },
    outputSchema: {
      result: z.number().describe("The sum of a and b"),
    },
  },
  async ({ a, b }) => {
    const output = { result: a + b };

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(output),
        },
      ],
      structuredContent: output,
    };
  }
);

mcpServer.registerTool(
  "echo_text",
  {
    title: "Echo Text",
    description: "Return the same text back. Useful for debugging.",
    inputSchema: {
      text: z.string().min(1).describe("Text to be echoed back"),
    },
    outputSchema: {
      echoed: z.string().describe("Echoed text"),
      length: z.number().describe("Length of the echoed text"),
    },
  },
  async ({ text }) => {
    const output = {
      echoed: text,
      length: text.length,
    };

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(output),
        },
      ],
      structuredContent: output,
    };
  }
);

// --- Resources ---------------------------------------------------------------

const greetingTemplate = new ResourceTemplate("greeting://{name}", {
  list: undefined,
});

mcpServer.registerResource(
  "greeting_resource",
  greetingTemplate,
  {
    title: "Greeting Resource",
    description: "Returns a personalized greeting for a given name.",
    mimeType: "text/plain",
  },
  async (uri, { name }) => {
    const safeName = name || "stranger";
    const message = `Hello, ${safeName}! This greeting comes from the MCP server.`;

    return {
      contents: [
        {
          uri: uri.href,
          text: message,
        },
      ],
    };
  }
);

// --- Express + Streamable HTTP transport ------------------------------------

const app = express();

// Некоторые клиенты любят `type: "*/*"`, но можно и просто `express.json()`
app.use(
  express.json({
    limit: "1mb",
  })
);

// MCP endpoint: POST /mcp  (stateless mode)
app.post("/mcp", async (req: Request, res: Response) => {
  try {
    const transport = new StreamableHTTPServerTransport({
      // stateless: новый транспорт на каждый запрос
      sessionIdGenerator: undefined,
      enableJsonResponse: true,
    });

    res.on("close", () => {
      transport.close();
    });

    await mcpServer.connect(transport);
    await transport.handleRequest(req, res, req.body);
  } catch (error) {
    console.error("Error handling MCP request:", error);

    if (!res.headersSent) {
      // JSON-RPC совместимый ответ об ошибке
      res.status(500).json({
        jsonrpc: "2.0",
        error: {
          code: -32603,
          message: "Internal server error",
        },
        id: null,
      });
    }
  }
});

// В stateless-паттерне GET /mcp не поддерживается
app.get("/mcp", (_req: Request, res: Response) => {
  res.status(405).end();
});

const port = parseInt(process.env.PORT || "3000", 10);

app
  .listen(port, () => {
    console.log(`✅ MCP server is running on http://localhost:${port}/mcp`);
  })
  .on("error", (error) => {
    console.error("Server error:", error);
    process.exit(1);
  });
