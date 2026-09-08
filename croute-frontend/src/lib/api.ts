import axios, { AxiosError } from "axios";

import type {
  AskRequest,
  AskResponse,
  ExtractProfileResponse,
  HealthResponse,
  ProfileRequest,
  ProfileResponse,
  SkillGap,
  WhatIfRequest,
  WhatIfResponse,
} from "./types";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

const client = axios.create({
  baseURL: API_BASE_URL,
  timeout: 60_000,
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
      return new ApiError("Taking a moment to start up — please try again in a few seconds.");
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

export async function extractProfile(file: File): Promise<ExtractProfileResponse> {
  try {
    const formData = new FormData();
    formData.append("file", file);
    // Leave Content-Type unset here — the browser must compute the multipart
    // boundary itself; overriding the header (even to "multipart/form-data")
    // strips that boundary and the backend fails to parse the body.
    const { data } = await client.post<ExtractProfileResponse>("/extract-profile", formData, {
      headers: { "Content-Type": undefined },
    });
    return data;
  } catch (error) {
    throw toApiError(error);
  }
}

export async function getSkillGaps(
  skills: string[],
  occupationId: string
): Promise<SkillGap[]> {
  try {
    const { data } = await client.post<SkillGap[]>("/skill-gaps", {
      skills,
      occupation_id: occupationId,
    });
    return data;
  } catch (error) {
    throw toApiError(error);
  }
}

export async function askCro(payload: AskRequest): Promise<AskResponse> {
  try {
    const { data } = await client.post<AskResponse>("/ask", payload);
    return data;
  } catch (error) {
    throw toApiError(error);
  }
}

export async function postWhatIf(payload: WhatIfRequest): Promise<WhatIfResponse> {
  try {
    const { data } = await client.post<WhatIfResponse>("/whatif", payload);
    return data;
  } catch (error) {
    throw toApiError(error);
  }
}
