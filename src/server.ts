import express from "express";
import * as z from "zod/v4";
import {
  McpServer,
  ResourceTemplate
} from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";


const mcpServer = new McpServer({
  name: "my-mcp-server",
  version: "0.1.0"
});


mcpServer.registerTool(
  "add_numbers",
  {
    title: "Add Numbers",
    description: "Add two numbers and return the sum.",
    inputSchema: {
      a: z.number(),
      b: z.number()
    },
    outputSchema: {
      result: z.number()
    }
  },
  async ({ a, b }) => {
    const output = { result: a + b };

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(output)
        }
      ],
      structuredContent: output
    };
  }
);

mcpServer.registerTool(
  "echo_text",
  {
    title: "Echo Text",
    description: "Return the same text back. Useful for debugging.",
    inputSchema: {
      text: z.string()
    },
    outputSchema: {
      echoed: z.string(),
      length: z.number()
    }
  },
  async ({ text }) => {
    const output = {
      echoed: text,
      length: text.length
    };

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(output)
        }
      ],
      structuredContent: output
    };
  }
);

const greetingTemplate = new ResourceTemplate("greeting://{name}", {
  list: undefined
});

mcpServer.registerResource(
  "greeting_resource",
  greetingTemplate,
  {
    title: "Greeting Resource",
    description: "Returns a personalized greeting for a given name."
  },
  async (uri, { name }) => {
    const message = `Hello, ${name}! This greeting comes from the MCP server.`;

    return {
      contents: [
        {
          uri: uri.href,
          text: message
        }
      ]
    };
  }
);

const app = express();
app.use(express.json());

// MCP endpoint: POST /mcp
app.post("/mcp", async (req, res) => {
  const transport = new StreamableHTTPServerTransport({
    sessionIdGenerator: undefined,
    enableJsonResponse: true
  });

  res.on("close", () => {
    transport.close();
  });

  await mcpServer.connect(transport);
  await transport.handleRequest(req, res, req.body);
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
