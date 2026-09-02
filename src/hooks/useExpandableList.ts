import { useState, useMemo } from 'react';

/**
 * Reusable hook for managing 5-item list preview states with independent expansion.
 */
export function useExpandableList<T>(items: T[], initialLimit = 5) {
  const [isExpanded, setIsExpanded] = useState(false);

  const visibleItems = useMemo(() => {
    if (isExpanded || items.length <= initialLimit) {
      return items;
    }
    return items.slice(0, initialLimit);
  }, [items, isExpanded, initialLimit]);

  const hasMore = items.length > initialLimit;
  const remainingCount = Math.max(0, items.length - initialLimit);

  return {
    visibleItems,
    isExpanded,
    setIsExpanded,
    toggleExpand: () => setIsExpanded(prev => !prev),
    hasMore,
    totalCount: items.length,
    remainingCount
  };
}
