import { getConfig } from "./src/config/main.ts";
import { parseSubscription } from "./src/parser/main.ts";

// Define a structured response type
interface JsonResponse {
  error?: string;
  details?: string;
  [key: string]: unknown;
}

export default {
  async fetch(request: Request): Promise<Response> {
    try {
      const url = new URL(request.url);
      const queryParams = Object.fromEntries(url.searchParams.entries());

      // Provide a help message for root path with no query params
      if (url.pathname === "/" && Object.keys(queryParams).length === 0) {
        return createJsonResponse(
          {
            message:
              "Welcome to v2sing! Use the 'sub' query parameter to provide a subscription URL. For more information, visit: https://github.com/printfer/v2sing",
          },
          200,
        );
      }

      // Validate the `sub` query parameter
      const subscriptionUrl = queryParams.sub;
      if (!subscriptionUrl) {
        return createJsonResponse(
          { error: "Missing 'sub' query parameter" },
          400,
        );
      }

      // Fetch and parse subscription content
      const subscriptionContent = await fetchSubscriptionContent(
        subscriptionUrl,
      );
      const [singBoxSubscription, parserInfo] = parseSubscription(
        subscriptionContent,
      );

      // If `config` query parameter is provided, fetch the template
      const configTemplateUrl = queryParams.config;
      let singBoxConfig;
      if (configTemplateUrl) {
        try {
          const configTemplate = await fetchConfigTemplate(configTemplateUrl);
          singBoxConfig = getConfig(singBoxSubscription, configTemplate);
        } catch (error) {
          return createJsonResponse(
            { error: "Error fetching config template", details: error.message },
            500,
          );
        }
      } else {
        singBoxConfig = getConfig(singBoxSubscription);
      }

      // Logs parser success and errors in a structured format
      if (parserInfo.failedLines.length > 0) {
        console.log("Failed Line Details:");
        parserInfo.failedLines.forEach(({ line, error }) => {
          console.log(`- Line: ${line}`);
          console.log(`  Error: ${error}`);
        });
      }
      // Logs parser statistics
      console.log("Parser Summary:");
      console.log(`- Total Successful Parses: ${parserInfo.totalSuccess}`);
      console.log(`- Total Failed Parses: ${parserInfo.totalFailed}`);
      // Logs query parameters for debugging
      console.log("Query Information:");
      Object.entries(queryParams).forEach(([key, value]) => {
        console.log(`- ${key}: ${value}`);
      });

      return createJsonResponse(singBoxConfig);
    } catch (error) {
      return createJsonResponse(
        { error: "Failed to process subscription", details: error.message },
        500,
      );
    }
  },
};

// Function to validate a URL
function validateUrl(url: string): void {
  try {
    new URL(url); // Throws an error if URL is invalid
  } catch {
    throw new Error(`Invalid URL provided: ${url}`);
  }
}

/**
 * Fetches a configuration template from the provided URL.
 * @param url - The URL to fetch the configuration template from.
 */
async function fetchConfigTemplate(url: string): Promise<unknown> {
  validateUrl(url); // Ensure the config template URL is valid
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(
      `Failed to fetch config template from ${url}: ${response.statusText}`,
    );
  }
  return response.json();
}

/**
 * Fetches and returns the subscription content, handling BOM removal.
 * @param url - The subscription URL to fetch content from.
 */
async function fetchSubscriptionContent(url: string): Promise<string> {
  validateUrl(url); // Ensure the subscription URL is valid
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch subscription URL: ${response.statusText}`);
  }
  // Safely remove BOM if present
  return (await response.text()).replace(/^\ufeff/, "");
}

/**
 * Creates a standardized JSON response.
 * @param body - The JSON object to include in the response.
 * @param status - HTTP status code (default: 200).
 */
function createJsonResponse(
  body: JsonResponse,
  status: number = 200,
): Response {
  return new Response(JSON.stringify(body, null, 2), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}
