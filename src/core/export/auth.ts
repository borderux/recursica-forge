import CryptoJS from "crypto-js";
import Base64 from "crypto-js/enc-base64";
import Utf8 from "crypto-js/enc-utf8";

const BASE_URL = import.meta.env.VITE_RECURSICA_API_URL;
const PLUGIN_PHRASE = import.meta.env.VITE_PLUGIN_PHRASE;

// Validate BASE_URL at runtime
const getBaseUrl = (): string => {
  if (!BASE_URL) {
    const errorMessage =
      "VITE_RECURSICA_API_URL environment variable is not set. Please configure this in your environment or .env file.";
    console.error(errorMessage);
    throw new Error(errorMessage);
  }
  return BASE_URL;
};

const getSecureHeaders = (): HeadersInit => ({
  "Content-Type": "application/json",
});

// API endpoints configuration - validate BASE_URL when accessed
export const API_ENDPOINTS = {
  get keys() {
    return `${getBaseUrl()}/api/plugin/keys`;
  },
  get authorize() {
    return `${getBaseUrl()}/api/plugin/authorize`;
  },
  get token() {
    return `${getBaseUrl()}/api/plugin/token`;
  },
} as const;

// Secure fetch wrapper with built-in security headers
export const secureApiCall = async (
  endpoint: string,
  options: RequestInit = {},
): Promise<Response> => {
  const secureOptions: RequestInit = {
    ...options,
    headers: {
      ...getSecureHeaders(),
      ...options.headers,
    },
  };

  return fetch(endpoint, secureOptions);
};

// API service methods
export const apiService = {
  // Generate authentication keys
  generateKeys: async (userId: string) => {
    const response = await secureApiCall(API_ENDPOINTS.keys, {
      method: "POST",
      body: JSON.stringify({ userId }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error || "Failed to generate keys");
    }

    return response.json();
  },

  // Get GitHub authorization URL
  authorize: async (
    userId: string,
    readKey: string,
    writeKey: string,
    code: string,
  ) => {
    const response = await secureApiCall(API_ENDPOINTS.authorize, {
      method: "POST",
      body: JSON.stringify({
        userId,
        readKey,
        writeKey,
        code,
        provider: "github",
      }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error || "Failed to get authorization URL");
    }

    return response.json();
  },

  // Poll for access token
  getToken: async (userId: string, readKey: string, code: string) => {
    const response = await secureApiCall(API_ENDPOINTS.token, {
      method: "POST",
      body: JSON.stringify({ userId, readKey, code }),
    });

    console.log("getToken response status:", response.status);
    console.log("getToken response ok:", response.ok);

    if (!response.ok) {
      if (response.status === 401) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.error || "Authentication failed");
      }
      // For 202 (pending) or other statuses, still return the response data
    }

    try {
      const data = await response.json();
      console.log("getToken response data:", data);
      return data;
    } catch (jsonError) {
      console.error("Error parsing JSON response:", jsonError);
      throw new Error("Invalid response from server");
    }
  },
};

export function encrypt(value: string): string {
  if (!value) {
    throw new Error("Invalid argument");
  }

  if (!PLUGIN_PHRASE) {
    throw new Error("Plugin phrase not defined");
  }

  console.log(
    "Encrypting with phrase:",
    PLUGIN_PHRASE ? "defined" : "undefined",
  );

  const encrypted = CryptoJS.AES.encrypt(value, PLUGIN_PHRASE).toString();
  const words = Utf8.parse(encrypted);
  return Base64.stringify(words);
}

export function pluginTokenToCode(token: string): string {
  if (!token) {
    return "";
  }
  const response = {
    token,
    date: Date.now(),
  };
  return encrypt(JSON.stringify(response));
}
