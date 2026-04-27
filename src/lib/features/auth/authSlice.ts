import { createAsyncThunk, createSlice, type PayloadAction } from "@reduxjs/toolkit";
import { BASE_URL } from "@/lib/constant";

export type LoginCredentials = {
  email: string;
  password: string;
  role?: string;
};

type LoginResponse = {
  id?: string;
  email?: string;
  name?: string;
  phone?: string;
  roleName?: string;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
  businessId?: string;
  business_id?: string;
  token?: string;
  access_token?: string;
  message?: string;
  error?: string;
  data?: {
    token?: string;
    access_token?: string;
    roleName?: string;
    businessId?: string;
    business_id?: string;
    [key: string]: unknown;
  };
  [key: string]: unknown;
};

type AuthState = {
  user: LoginResponse | null;
  token: string | null;
  role: string | null;
  isLoading: boolean;
  error: string | null;
};

function getInitialAuthState(): AuthState {
  if (typeof window === "undefined") {
    return {
      user: null,
      token: null,
      role: null,
      isLoading: false,
      error: null,
    };
  }

  const token = localStorage.getItem("auth_token") || localStorage.getItem("token");
  const role =
    localStorage.getItem("roleName") ||
    localStorage.getItem("auth_role") ||
    null;
  const businessId = localStorage.getItem("businessId");

  return {
    user: businessId ? ({ businessId } as any) : null,
    token,
    role,
    isLoading: false,
    error: null,
  };
}

const initialState: AuthState = getInitialAuthState();

export const loginUser = createAsyncThunk<
  LoginResponse,
  LoginCredentials,
  { rejectValue: string }
>("auth/loginUser", async (credentials, { rejectWithValue }) => {
  try {
    const response = await fetch(`https://${BASE_URL}/users/login`, {
      method: "POST",
      headers: {
        accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(credentials),
    });

    const payload: LoginResponse = await response
      .json()
      .catch(() => ({ message: "Unable to parse login response." }));

    if (!response.ok) {
      return rejectWithValue(
        payload.message || payload.error || "Invalid email or password.",
      );
    }

    const token = 
      payload.token || 
      payload.access_token || 
      payload.data?.token || 
      payload.data?.access_token || 
      null;

    if (typeof window !== "undefined" && token) {
      localStorage.setItem("auth_token", token);
      localStorage.setItem("token", token);
    }

    return payload;
  } catch {
    return rejectWithValue("Network error. Please try again.");
  }
});

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    clearAuthError: (state) => {
      state.error = null;
    },
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.role = null;
      state.error = null;
      if (typeof window !== "undefined") {
        localStorage.removeItem("token");
        localStorage.removeItem("roleName");
        localStorage.removeItem("businessId");
        localStorage.removeItem("auth_token");
        localStorage.removeItem("auth_role");
      }
    },
    setToken: (state, action: PayloadAction<string | null>) => {
      state.token = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loginUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.isLoading = false;
        // Point to the nested data if available, otherwise fallback to the whole payload
        state.user = (action.payload.data as any) || action.payload;
        
        // Extract token with fallbacks for nested structures
        const token =
          (action.payload.token as string | undefined) ||
          (action.payload.access_token as string | undefined) ||
          (action.payload.data?.token as string | undefined) ||
          (action.payload.data?.access_token as string | undefined) ||
          null;
        
        state.token = token;

        // Extract role with fallbacks
        state.role =
          action.payload.roleName ||
          (action.payload.data?.roleName as string | undefined) ||
          (action.meta.arg.role as string | undefined) ||
          null;

        if (typeof window !== "undefined") {
          if (state.token) {
            localStorage.setItem("token", state.token);
            localStorage.setItem("auth_token", state.token);
          } else {
            // Only remove if we really didn't get a token
            // This prevents accidental deletion if the response format is unexpected
          }

          if (state.role) {
            localStorage.setItem("roleName", state.role);
            localStorage.setItem("auth_role", state.role);
          }

          // Extract businessId with fallbacks
          const businessId =
            (action.payload.businessId as string | undefined) ||
            (action.payload.business_id as string | undefined) ||
            (action.payload.data?.businessId as string | undefined) ||
            (action.payload.data?.business_id as string | undefined) ||
            null;

          if (businessId) {
            localStorage.setItem("businessId", businessId);
          }
        }
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload || "Login failed.";
      });
  },
});

export const { clearAuthError, logout, setToken } = authSlice.actions;
export default authSlice.reducer;
