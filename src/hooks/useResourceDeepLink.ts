import { useEffect } from 'react';

export function useResourceDeepLink<T extends { id: string; documentId?: string }>(
  loading: boolean,
  items: T[],
  onOpenDetails: (item: T) => void
) {
  useEffect(() => {
    if (!loading && items.length > 0) {
      const searchParam = new URLSearchParams(window.location.search).get('search');
      if (searchParam) {
        const match = items.find(
          (item) => item.id === searchParam || item.documentId === searchParam
        );
        if (match) {
          onOpenDetails(match);
          
          // Clear 'search' query parameter from URL to prevent auto-reopen loops on close
          try {
            const url = new URL(window.location.href);
            url.searchParams.delete('search');
            window.history.replaceState({}, '', url.pathname + url.search);
          } catch (e) {
            console.error("Failed to clean deep link search param from URL:", e);
          }
        }
      }
    }
  }, [loading, items, onOpenDetails]);
}
export default useResourceDeepLink;
