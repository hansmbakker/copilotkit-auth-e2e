/* eslint-disable no-console */
import express from "express";
import { Readable } from "node:stream";
import type { ReadableStream as WebReadableStream } from "node:stream/web";
import { CopilotRuntime, createCopilotRuntimeHandler } from "@copilotkit/runtime/v2";
import { HttpAgent } from "@ag-ui/client";

// Aspire injects the agentservice URL via environment variables.
const agentServiceUrl =
  process.env["services__agentservice__https__0"] || process.env["services__agentservice__http__0"];

if (!agentServiceUrl) {
  throw new Error(
    "AgentService URL not found. Expected services__agentservice__https__0 or services__agentservice__http__0 to be set by Aspire.",
  );
}

const agentUrl = `${agentServiceUrl}/agui`;

const runtime = new CopilotRuntime({
  agents: {
    TravelBookingAgent: new HttpAgent({ url: agentUrl }) as any,
  }
});

const handler = createCopilotRuntimeHandler({
  runtime,
  basePath: "/copilotkit",
});

const app = express();

// Delegate all /copilotkit/* requests to the fetch-native handler.
// req.headers includes Authorization — forwarded unchanged to the agent service.
app.all("/copilotkit/*splat", async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const webReq = new Request(url, {
    method: req.method,
    headers: req.headers as Record<string, string>,
    body: ["GET", "HEAD"].includes(req.method!) ? undefined : req,
    duplex: "half",
  } as RequestInit);
  const webRes = await handler(webReq);
  res.status(webRes.status);
  webRes.headers.forEach((v, k) => res.setHeader(k, v));
  if (webRes.body) {
    Readable.fromWeb(webRes.body as unknown as WebReadableStream).pipe(res);
  } else {
    res.end();
  }
});

app.get("/health", (_req, res) => {
  res.json({ status: "healthy" });
});

const port = Number(process.env["PORT"] ?? 4000);
app.listen(port, () => {
  console.log(`Copilot Runtime listening on port ${port}`);
});
