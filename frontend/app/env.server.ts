// app/env.server.ts
export const ENV = {
  API_BASE_URL: process.env.API_BASE_URL ?? "http://127.0.0.1:8000",
  NODE_ENV: process.env.NODE_ENV ?? "development",
};

export const isProd = ENV.NODE_ENV === "production";
