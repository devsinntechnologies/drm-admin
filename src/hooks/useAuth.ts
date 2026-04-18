import { useCallback } from "react";
import {
  clearAuthError,
  loginUser,
  logout as logoutAction,
  type LoginCredentials,
} from "@/lib/features/auth/authSlice";
import { useAppDispatch, useAppSelector } from "@/lib/hooks";

export function useAuth() {
  const dispatch = useAppDispatch();
  const { user, token, role, isLoading, error } = useAppSelector((state) => state.auth);

  const login = useCallback(
    async (credentials: LoginCredentials) => {
      const action = await dispatch(loginUser(credentials));
      return loginUser.fulfilled.match(action);
    },
    [dispatch],
  );

  const clearError = useCallback(() => {
    dispatch(clearAuthError());
  }, [dispatch]);

  const logout = useCallback(() => {
    dispatch(logoutAction());
  }, [dispatch]);

  return {
    user,
    token,
    role,
    isLoading,
    error,
    isAuthenticated: Boolean(token),
    login,
    clearError,
    logout,
  };
}
