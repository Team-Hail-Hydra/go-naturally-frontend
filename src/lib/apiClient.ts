import axios from "axios";
import type { AxiosInstance, AxiosRequestConfig, AxiosResponse } from "axios";
import { createClient } from "@supabase/supabase-js";

// Initialize Supabase client
const supabaseUrl = import.meta.env.VITE_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = import.meta.env.VITE_PUBLIC_SUPABASE_ANON_KEY || "";
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// API Client class
class ApiClient {
  private axios: AxiosInstance;
  private baseURL: string;

  constructor() {
    this.baseURL =
      import.meta.env.VITE_API_BASE_URL || "http://localhost:3000/api/v1";

    this.axios = axios.create({
      baseURL: this.baseURL,
      timeout: 30000,
      headers: {
        "Content-Type": "application/json",
      },
    });

    // Request interceptor to add auth token
    this.axios.interceptors.request.use(
      async (config) => {
        try {
          const {
            data: { session },
          } = await supabase.auth.getSession();
          if (session?.access_token) {
            config.headers.Authorization = `Bearer ${session.access_token}`;
          }
        } catch (error) {
          console.warn("Failed to get auth token:", error);
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor for error handling
    this.axios.interceptors.response.use(
      (response: AxiosResponse) => response,
      (error) => {
        console.error("API Error:", error.response?.data || error.message);
        return Promise.reject(error);
      }
    );
  }

  // Generic request methods
  async get<T = unknown>(
    url: string,
    config?: AxiosRequestConfig
  ): Promise<AxiosResponse<T>> {
    return this.axios.get<T>(url, config);
  }

  async post<T = unknown>(
    url: string,
    data?: unknown,
    config?: AxiosRequestConfig
  ): Promise<AxiosResponse<T>> {
    return this.axios.post<T>(url, data, config);
  }

  async put<T = unknown>(
    url: string,
    data?: unknown,
    config?: AxiosRequestConfig
  ): Promise<AxiosResponse<T>> {
    return this.axios.put<T>(url, data, config);
  }

  async patch<T = unknown>(
    url: string,
    data?: unknown,
    config?: AxiosRequestConfig
  ): Promise<AxiosResponse<T>> {
    return this.axios.patch<T>(url, data, config);
  }

  async delete<T = unknown>(
    url: string,
    config?: AxiosRequestConfig
  ): Promise<AxiosResponse<T>> {
    return this.axios.delete<T>(url, config);
  }

  // Specialized methods for multipart/form-data
  async postFormData<T = unknown>(
    url: string,
    formData: FormData,
    config?: AxiosRequestConfig
  ): Promise<AxiosResponse<T>> {
    return this.axios.post<T>(url, formData, {
      ...config,
      headers: {
        ...config?.headers,
        "Content-Type": "multipart/form-data",
      },
    });
  }

  // User-related API calls
  user = {
    create: (userData: Record<string, unknown>) => this.post("/user", userData),
    getById: (userId: string) => this.get(`/user/${userId}`),
    update: (userId: string, userData: Record<string, unknown>) =>
      this.put(`/user/${userId}`, userData),
  };

  // Organization-related API calls
  organization = {
    createSchool: (schoolData: Record<string, unknown>) =>
      this.post("/org/School", schoolData),
    createNGO: (ngoData: Record<string, unknown>) =>
      this.post("/org/NGO", ngoData),
    joinSchool: (joinData: Record<string, unknown>) =>
      this.post("/org/join/School", joinData),
    joinNGO: (joinData: Record<string, unknown>) =>
      this.post("/org/join/NGO", joinData),
  };

  // Marker-related API calls
  markers = {
    getAll: () => this.get("/markers"),
  };

  // Plant-related API calls
  plants = {
    upload: (formData: FormData) =>
      this.postFormData("/plants/upload", formData),
  };

  // Animal-related API calls
  animals = {
    upload: (formData: FormData) =>
      this.postFormData("/animal/upload", formData),
  };

  // Litter-related API calls
  litter = {
    upload: (formData: FormData) =>
      this.postFormData("/litter/upload", formData),
  };

  // Leaderboard-related API calls
  leaderboard = {
    getAll: () => this.get("/leaderboard"),
  };

  // Event-related API calls
  events = {
    getSchoolEvents: (params?: string) =>
      this.get(`/school/events${params || ""}`),
    getNGOEvents: (params?: string) => this.get(`/ngo/events${params || ""}`),
    createSchoolEvent: (eventData: Record<string, unknown>) =>
      this.post("/school/event", eventData),
    createNGOEvent: (eventData: Record<string, unknown>) =>
      this.post("/ngo/event", eventData),
    applyToSchoolEvent: (applicationData: Record<string, unknown>) =>
      this.post("/school/event/apply", applicationData),
    applyToNGOEvent: (applicationData: Record<string, unknown>) =>
      this.post("/ngo/event/apply", applicationData),
  };
}

// Create and export a singleton instance
export const apiClient = new ApiClient();

// Export the class for testing or custom instances
export { ApiClient };

// Helper function to get current auth token (useful for non-API HTTP calls)
export const getCurrentAuthToken = async (): Promise<string | null> => {
  try {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    return session?.access_token || null;
  } catch (error) {
    console.warn("Failed to get auth token:", error);
    return null;
  }
};
