import { useState, useCallback } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

interface OptimisticUpdateOptions<TData, TVariables> {
  mutationFn: (variables: TVariables) => Promise<TData>;
  queryKey: string[];
  updateFn: (oldData: any, variables: TVariables) => any;
  successMessage?: string;
  errorMessage?: string;
  onSuccess?: (data: TData) => void;
  onError?: (error: Error) => void;
}

export function useOptimisticUpdate<TData, TVariables>({
  mutationFn,
  queryKey,
  updateFn,
  successMessage,
  errorMessage = 'Operation failed. Changes will be synced when online.',
  onSuccess,
  onError,
}: OptimisticUpdateOptions<TData, TVariables>) {
  const queryClient = useQueryClient();
  const [pendingUpdates, setPendingUpdates] = useState<TVariables[]>([]);

  const mutation = useMutation({
    mutationFn,
    onMutate: async (variables) => {
      await queryClient.cancelQueries({ queryKey });

      const previousData = queryClient.getQueryData(queryKey);

      queryClient.setQueryData(queryKey, (old: any) => updateFn(old, variables));

      setPendingUpdates((prev) => [...prev, variables]);

      return { previousData };
    },
    onSuccess: (data) => {
      setPendingUpdates((prev) => prev.slice(1));
      if (successMessage) {
        toast.success(successMessage);
      }
      onSuccess?.(data);
    },
    onError: (error, variables, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(queryKey, context.previousData);
      }

      setPendingUpdates((prev) => prev.filter((v) => v !== variables));

      toast.error(errorMessage);
      onError?.(error as Error);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });

  const retryPendingUpdates = useCallback(async () => {
    for (const update of pendingUpdates) {
      try {
        await mutationFn(update);
      } catch (error) {
        console.error('Failed to retry update:', error);
      }
    }
    setPendingUpdates([]);
  }, [pendingUpdates, mutationFn]);

  return {
    ...mutation,
    pendingUpdates,
    hasPendingUpdates: pendingUpdates.length > 0,
    retryPendingUpdates,
  };
}
