"use client";

import { useCallback, useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useSafety } from "@/app/context/SafetyContext";
import { useSafetyCityQuery } from "@/hooks/queries/useSafetyQuery";
import { getSafetyByCoordinates } from "@/lib/api/safety";
import { safetyKeys } from "@/hooks/queries/queryKeys";
import type { SafetyData } from "@/types";
import { showToast } from "@/components/ui/Toast";

export function useSafetyData() {
  const { state, dispatch } = useSafety();
  const queryClient = useQueryClient();
  const [isLocating, setIsLocating] = useState(false);

  // TanStack Query handles caching, deduplication, background refetching (every 60s), and stale time
  const {
    data: queryData,
    isLoading: queryLoading,
    isFetching,
    error: queryError,
    refetch,
    dataUpdatedAt,
  } = useSafetyCityQuery(state.city);

  // Synchronize TanStack Query server data into SafetyContext when fresh data arrives
  useEffect(() => {
    if (queryData) {
      dispatch({ type: "SET_DATA", payload: queryData as unknown as SafetyData });
    }
  }, [queryData, dispatch]);

  // Synchronize query errors into context and toast
  useEffect(() => {
    if (queryError) {
      const message =
        queryError instanceof Error
          ? queryError.message
          : "Failed to fetch safety data";
      dispatch({ type: "SET_ERROR", payload: message });
      showToast("error", message);
    }
  }, [queryError, dispatch]);

  const search = useCallback(
    (cityName: string) => {
      const trimmed = cityName.trim();
      if (!trimmed) return;
      dispatch({ type: "SET_CITY", payload: trimmed });
      // Invalidate or trigger fetch for the searched city immediately
      queryClient.prefetchQuery({
        queryKey: safetyKeys.city(trimmed),
        queryFn: () => queryClient.fetchQuery({ queryKey: safetyKeys.city(trimmed) }),
      }).catch(() => {});
    },
    [dispatch, queryClient]
  );

  const refresh = useCallback(() => {
    if (state.city) {
      refetch();
    }
  }, [state.city, refetch]);

  const locateMe = useCallback(async () => {
    if (!navigator.geolocation) {
      showToast("error", "Geolocation is not supported in this browser.");
      return;
    }

    setIsLocating(true);
    dispatch({ type: "SET_LOADING", payload: true });
    dispatch({ type: "CLEAR_ERROR" });

    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        });
      });

      const lat = position.coords.latitude;
      const lon = position.coords.longitude;

      // Execute typed and Zod-validated query
      const validatedData = await queryClient.fetchQuery({
        queryKey: safetyKeys.coordinates(lat, lon),
        queryFn: () => getSafetyByCoordinates(lat, lon),
        staleTime: 60 * 1000,
      });

      dispatch({ type: "SET_CITY", payload: validatedData.city });
      dispatch({ type: "SET_DATA", payload: validatedData as unknown as SafetyData });

      // Seed the city cache in TanStack Query so subsequent city lookups are immediate
      queryClient.setQueryData(safetyKeys.city(validatedData.city), validatedData);

      showToast("success", `Using your current location: ${validatedData.city}`);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Unable to use current location.";
      dispatch({ type: "SET_ERROR", payload: message });
      showToast("error", message);
    } finally {
      setIsLocating(false);
      dispatch({ type: "SET_LOADING", payload: false });
    }
  }, [dispatch, queryClient]);

  const activeData = (queryData as unknown as SafetyData) || state.safetyData;
  const isLoading = isLocating || (queryLoading && !activeData);

  return {
    data: activeData,
    loading: isLoading,
    isFetching,
    error: state.error || (queryError ? queryError.message : null),
    city: state.city,
    lastUpdated: dataUpdatedAt ? new Date(dataUpdatedAt) : state.lastUpdated,
    search,
    refresh,
    locateMe,
  };
}
