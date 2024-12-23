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

      // Check if the path is `/` (root) and provide a help message
      if (url.pathname === "/" && Object.keys(queryParams).length === 0) {
        return createJsonResponse(
          {
            message:
              "Welcome to v2sing! Use the `sub` query parameter to provide a subscription URL. For more information, please visit: https://github.com/printfer/v2sing",
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

      // Fetch the subscription content
      const subscriptionContent = await fetchSubscriptionContent(
        subscriptionUrl,
      );

      // Parse the subscription content
      const singBoxSubscription = parseSubscription(subscriptionContent);
      const singBoxConfig = getConfig(singBoxSubscription);

      console.log(JSON.stringify({ options: queryParams }, null, 2));

      // Return the generated configuration
      return createJsonResponse(singBoxConfig);
    } catch (error) {
      // Handle errors gracefully
      return createJsonResponse(
        { error: "Failed to process subscription", details: error.message },
        500,
      );
    }
  },
};

/**
 * Fetches and returns the subscription content, handling BOM removal.
 * @param url - The subscription URL to fetch content from.
 */
async function fetchSubscriptionContent(url: string): Promise<string> {
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
