import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useActiveBusinessId } from "@/hooks/useActiveBusinessId";
import { BASE_URL } from "@/lib/constant";

export interface Ingredient {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  businessId: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateIngredientPayload {
  name: string;
  quantity: number;
  unit: string;
}

export function useIngredients() {
  const { token } = useAuth();
  const activeBusinessId = useActiveBusinessId();

  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchIngredients = useCallback(async () => {
    const authToken = token || localStorage.getItem("auth_token") || localStorage.getItem("token");

    if (!authToken) return;

    setLoading(true);
    setError(null);

    try {
      const url = new URL(`${BASE_URL}/ingredients`);
      if (activeBusinessId) {
        url.searchParams.append("businessId", activeBusinessId);
      }

      const response = await fetch(url.toString(), {
        method: "GET",
        headers: {
          "accept": "application/json",
          "Authorization": `Bearer ${authToken}`,
        },
      });

      if (!response.ok) {
        if (response.status === 404) {
          setIngredients([]);
          return;
        }
        throw new Error("Failed to fetch ingredients");
      }

      const res = await response.json();
      setIngredients(res.data ?? res);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  }, [token, activeBusinessId]);

  useEffect(() => {
    fetchIngredients();
  }, [fetchIngredients]);

  const createIngredient = useCallback(async (payload: CreateIngredientPayload) => {
    const authToken = token || localStorage.getItem("auth_token") || localStorage.getItem("token");
    if (!authToken) throw new Error("Unauthorized");

    setActionLoading(true);
    try {
      const url = new URL(`${BASE_URL}/ingredients`);
      if (activeBusinessId) {
        url.searchParams.append("businessId", activeBusinessId);
      }

      const response = await fetch(url.toString(), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${authToken}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.message || "Failed to create ingredient");
      }

      await fetchIngredients();
      return true;
    } finally {
      setActionLoading(false);
    }
  }, [token, activeBusinessId, fetchIngredients]);

  return {
    ingredients,
    loading,
    actionLoading,
    error,
    createIngredient,
    refetch: fetchIngredients,
  };
}
