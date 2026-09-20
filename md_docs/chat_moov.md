The `moov-typescript` repository provides a headless server and client library, not a dedicated graphical console. Th...
  Inside this specific repository, there is no built-in graphical web UI (it is strictly a headless TypeScript SDK and
  MCP server).

  However, you have three options for a console to interact with it:
  ──────
  ### 1. Instant Local Web Console (via MCP Inspector)

  Because this repository compiles into a Model Context Protocol (MCP) server, you can launch an interactive developer
  web console with zero extra code using the official MCP Inspector.
  Once you run npm run build in moov-typescript, run:

    cd /home/cyrus/Projects/API_Projects/moov-typescript
    
    npx @modelcontextprotocol/inspector node bin/mcp-server.js start \
      --username "YOUR_MOOV_PUBLIC_KEY" \
      --password "YOUR_MOOV_PRIVATE_KEY"

  What this gives you:

  • Automatically opens a local web browser GUI at http://localhost:6274.
  • Renders an interactive console listing all 40+ Moov tools (transfers_create, wallets_get, accounts_create, etc.).
  • Allows you to fill out form fields, click "Run Tool", and see the live API requests and JSON responses in real-time.
  ──────
  ### 2. The Official Moov Web Dashboard

  Moov provides a full hosted developer and merchant console:

  • Sandbox / Production Dashboard: dashboard.moov.io https://dashboard.moov.io/

  In this dashboard, you can:

  • Generate and manage your API Public / Private keys.
  • View live and sandbox digital wallets and balance ledgers.
  • Track real-time FedNow, RTP, and ACH transfers.
  • Manually trigger sandbox simulations (e.g., simulate an ACH settlement or test a disputed transaction).
  ──────
  ### 3. Your Own Custom Console (sukiGatewayClient)

  sukiGatewayClient is designed to be your console!

  Because you already have this React + Vite merchant application, you can use @moovio/sdk to render your own tailored
  panels:

  • A Wallet & Balance Widget to show ledger funds.
  • A FedNow / ACH Transfer Console to trigger payouts.
  • A Transaction History Table pulling from moov.walletTransactions.list().

  Rest well, and we can wire up these components whenever you're ready tomorrow!

  ///
  > Ok, work with this: http://localhost:6274/ , next steps are?

▸ Thought for 2s, 573 tokens
  Initial assessment: Verify the status of the inspector and the MCP server. Need to recall the executed startup command, specifi...

● Bash(ls -la .env* examples/.env* || true)
● Read(~/Projects/API_Projects/moov-typescript/examples/.env.template)
● Bash(ls -la src/mcp-server/tools/ | head -n 30) (ctrl+o to expand)
▸ Thought for 2s
  The initial step is to understand the purpose of the displayed interface. The interface appears to be a control panel with conn...
  Now that you have http://localhost:6274/ open in your browser, here are your immediate next steps:
  ──────
  ### Step 1: Connect to the Server

  1. In the MCP Inspector UI header, ensure the connection state is Connected.
  2. If it is not connected, click Connect (the transport is already set up over stdio with node bin/mcp-server.js start).
  ──────
  ### Step 2: Explore Available Tools

  1. Click the Tools tab in the top navigation.
  2. Click List Tools.
  3. You will see 100+ Moov financial tools populated (e.g., accountsList, walletsGet, transfersCreate, bankAccountsList,
  cardsList).
  4. Select any tool to inspect its required input schema and parameter descriptions.
  ──────
  ### Step 3: Test a Tool

  1. Select a read-only tool like accountsList.
  2. Click Run Tool.
  3. The raw JSON request and response payloads will be displayed in the right-hand panel.
  ──────
  ### Step 4: Add Real Sandbox Credentials (When Ready)

  Currently, the inspector was started with placeholder flags:
  --username YOUR_MOOV_PUBLIC_KEY --password YOUR_MOOV_PRIVATE_KEY

  Live calls to Moov's API will return 401 Unauthorized until real keys are provided. To test real API calls against the Moov
  Sandbox:

  1. Obtain your API keys from the Moov Dashboard https://dashboard.moov.io/.
  2. Stop the current inspector process (Ctrl + C in the terminal where it is running).
  3. Restart it with your real sandbox keys:
    npx @modelcontextprotocol/inspector node bin/mcp-server.js start \
      --username "your_public_key_here" \
      --password "your_private_key_here"

  ──────
  ### Step 5: Connect to an AI Assistant or Your Frontend

  When you are done testing in the inspector, you can:

  • Configure Antigravity / Claude / Cursor: Add the MCP server config from userManual_moov.md:287-316 to let an AI assistant
  manage transfers, ledgers, and accounts autonomously.
  • Connect sukiGatewayClient: Start the merchant UI (cd ../sukiGatewayClient && npm run dev) on http://localhost:5173/ to build
  custom payment widgets.


//

The block message is coming directly from Cloudflare WAF (server: cloudflare), which protects dashboard.moov.io.
  ──────
  ### The Exact Reason

  Your internet connection currently originates from Venezuela (VE):

  • Moov Financial is a US-regulated financial institution and licensed money transmitter operating directly on US Federal Reserve
  and banking rails (FedNow, RTP, ACH).
  • Under US federal financial regulations (OFAC sanctions compliance, FinCEN, and the Bank Secrecy Act), US banking providers are
  legally required to restrict access to authenticated dashboards, account creation, and financial management portals from
  sanctioned or restricted regions.
  • While public educational sites like docs.moov.io https://docs.moov.io/ and moov.io https://moov.io/ allow global traffic,
  dashboard.moov.io is strictly geo-fenced at the Cloudflare edge.
  ──────
  ### How to Proceed

  Depending on your development goals, here is how you can continue:

  #### 1. If You Have Access to a US Network (VPN / US VPS)

  If you or your company have a US-based server, remote desktop, or VPN:

  • Connecting through a US residential or business network will allow you to access dashboard.moov.io https://dashboard.moov.io/
  to sign up and view test credentials.

  #### 2. Develop & Test Locally Without Live API Keys

  You do not need a live dashboard connection to develop and test your applications:

  • Explore MCP Tools: In your local MCP Inspector (http://localhost:6274/), you can inspect the full JSON schemas, parameter
  requirements, and prompts for all 100+ Moov tools without making external network calls.
  • Frontend Development (sukiGatewayClient): You can build and style all UI components (payment buttons, wallet balance cards,
  transfer forms) in sukiGatewayClient using TypeScript types and mock data from the SDK.
  • Local SDK Typechecking: The complete type definitions, Zod validation models, and request/response structures in moov-
  typescript are fully available offline on your machine.
