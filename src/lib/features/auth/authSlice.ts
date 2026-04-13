import { createAsyncThunk, createSlice, type PayloadAction } from "@reduxjs/toolkit";

export type LoginCredentials = {
  email: string;
  password: string;
};

type LoginResponse = {
  token?: string;
  access_token?: string;
  message?: string;
  error?: string;
  [key: string]: unknown;
};

type AuthState = {
  user: LoginResponse | null;
  token: string | null;
  isLoading: boolean;
  error: string | null;
};

const initialState: AuthState = {
  user: null,
  token: null,
  isLoading: false,
  error: null,
};

export const loginUser = createAsyncThunk<
  LoginResponse,
  LoginCredentials,
  { rejectValue: string }
>("auth/loginUser", async (credentials, { rejectWithValue }) => {
  try {
    const response = await fetch("https://vendor.umazing.shop/users/login", {
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

    const token = payload.token || payload.access_token || null;
    if (typeof window !== "undefined" && token) {
      localStorage.setItem("auth_token", token);
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
      state.error = null;
      if (typeof window !== "undefined") {
        localStorage.removeItem("auth_token");
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
        state.user = action.payload;
        state.token =
          (action.payload.token as string | undefined) ||
          (action.payload.access_token as string | undefined) ||
          null;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload || "Login failed.";
      });
  },
});

export const { clearAuthError, logout, setToken } = authSlice.actions;
export default authSlice.reducer;
