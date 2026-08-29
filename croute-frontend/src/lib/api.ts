import axios, { AxiosError } from "axios";

import type { HealthResponse, ProfileRequest, ProfileResponse } from "./types";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

const client = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30_000,
  headers: { "Content-Type": "application/json" },
});

export class ApiError extends Error {
  status?: number;

  constructor(message: string, status?: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

function toApiError(error: unknown): ApiError {
  if (axios.isAxiosError(error)) {
    const err = error as AxiosError<{ detail?: string }>;
    if (err.code === "ECONNABORTED") {
      return new ApiError("Backend timed out (30s). Try again.");
    }
    if (!err.response) {
      return new ApiError(
        `Cannot reach the backend at ${API_BASE_URL}. Is the API server running?`
      );
    }
    const detail = err.response.data?.detail;
    return new ApiError(
      detail || `API error ${err.response.status}: ${err.response.statusText}`,
      err.response.status
    );
  }
  return new ApiError("Unexpected error calling the API.");
}

export async function getHealth(): Promise<HealthResponse> {
  try {
    const { data } = await client.get<HealthResponse>("/health");
    return data;
  } catch (error) {
    throw toApiError(error);
  }
}

export async function postProfile(payload: ProfileRequest): Promise<ProfileResponse> {
  try {
    const { data } = await client.post<ProfileResponse>("/profile", payload);
    return data;
  } catch (error) {
    throw toApiError(error);
  }
}
