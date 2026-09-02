import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowDown, ArrowUp } from 'lucide-react';
import { cn } from '@/lib/utils';
export { useExpandableList } from '@/hooks/useExpandableList';

export interface SeeMoreTableRowProps {
  colSpan: number;
  isExpanded?: boolean;
  onToggle?: () => void;
  remainingCount?: number;
  totalCount?: number;
  to?: string;
  onClick?: () => void;
  className?: string;
  label?: string;
}

/**
 * Table-row affordance rendered as the next natural row in a table with highlighted blue styling.
 */
export const SeeMoreTableRow: React.FC<SeeMoreTableRowProps> = ({
  colSpan,
  isExpanded = false,
  onToggle,
  remainingCount = 0,
  to,
  onClick,
  className,
  label
}) => {
  const handleClick = (e: React.MouseEvent) => {
    if (to) return;
    e.stopPropagation();
    if (onClick) {
      onClick();
    } else if (onToggle) {
      onToggle();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (to) return;
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      e.stopPropagation();
      if (onClick) {
        onClick();
      } else if (onToggle) {
        onToggle();
      }
    }
  };

  const content = isExpanded ? (
    <div className="inline-flex items-center justify-center gap-2 text-sm font-medium py-0.5 px-3">
      <span className="font-semibold text-blue-400 dark:text-blue-300 group-hover:text-blue-200 transition-colors">
        {label ? `Show Less ${label}` : 'Show Less'}
      </span>
      <ArrowUp className="h-4 w-4 text-blue-400 dark:text-blue-300 group-hover:text-blue-200 transition-all duration-200 group-hover:-translate-y-0.5 shrink-0" />
    </div>
  ) : (
    <div className="inline-flex items-center justify-center gap-2 text-sm font-medium py-0.5 px-3">
      <span className="font-semibold text-blue-400 dark:text-blue-300 group-hover:text-blue-200 transition-colors">
        {label || 'See More'}
      </span>
      <span className="text-blue-300/70 font-normal">·</span>
      <span className="text-blue-200/90 group-hover:text-white transition-colors">
        {remainingCount} more
      </span>
      <ArrowDown className="h-4 w-4 text-blue-400 dark:text-blue-300 group-hover:text-blue-200 transition-all duration-200 group-hover:translate-y-0.5 shrink-0 ml-0.5" />
    </div>
  );

  return (
    <tr
      className={cn(
        'border-t border-blue-500/25 bg-blue-500/[0.08] hover:bg-blue-500/[0.15] dark:bg-blue-950/30 dark:hover:bg-blue-900/40 transition-colors cursor-pointer select-none group',
        className
      )}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      role="button"
      tabIndex={to ? undefined : 0}
      aria-expanded={to ? undefined : isExpanded}
    >
      <td colSpan={colSpan} className="py-3 px-4 text-center">
        {to ? (
          <Link
            to={to}
            className="sticky left-0 flex items-center justify-center w-full focus:outline-none focus:ring-1 focus:ring-blue-400/50 rounded-md"
          >
            {content}
          </Link>
        ) : (
          <div className="sticky left-0 flex items-center justify-center w-full">
            {content}
          </div>
        )}
      </td>
    </tr>
  );
};

export interface SeeMoreListAffordanceProps {
  isExpanded?: boolean;
  onToggle?: () => void;
  remainingCount?: number;
  totalCount?: number;
  to?: string;
  onClick?: () => void;
  className?: string;
  label?: string;
}

/**
 * List/card affordance rendered at the bottom of non-table list sections with highlighted blue styling.
 */
export const SeeMoreListAffordance: React.FC<SeeMoreListAffordanceProps> = ({
  isExpanded = false,
  onToggle,
  remainingCount = 0,
  to,
  onClick,
  className,
  label
}) => {
  const content = isExpanded ? (
    <div className="inline-flex items-center justify-center gap-2 text-sm font-medium">
      <span className="font-semibold text-blue-400 dark:text-blue-300 group-hover:text-blue-200 transition-colors">
        {label ? `Show Less ${label}` : 'Show Less'}
      </span>
      <ArrowUp className="h-4 w-4 text-blue-400 dark:text-blue-300 group-hover:text-blue-200 transition-all duration-200 group-hover:-translate-y-0.5 shrink-0" />
    </div>
  ) : (
    <div className="inline-flex items-center justify-center gap-2 text-sm font-medium">
      <span className="font-semibold text-blue-400 dark:text-blue-300 group-hover:text-blue-200 transition-colors">
        {label || 'See More'}
      </span>
      {remainingCount > 0 && (
        <>
          <span className="text-blue-300/70 font-normal">·</span>
          <span className="text-blue-200/90 group-hover:text-white transition-colors">
            {remainingCount} more
          </span>
        </>
      )}
      <ArrowDown className="h-4 w-4 text-blue-400 dark:text-blue-300 group-hover:text-blue-200 transition-all duration-200 group-hover:translate-y-0.5 shrink-0 ml-0.5" />
    </div>
  );

  if (to) {
    return (
      <Link
        to={to}
        className={cn(
          'flex items-center justify-center py-3 px-4 bg-blue-500/[0.08] hover:bg-blue-500/[0.15] dark:bg-blue-950/30 dark:hover:bg-blue-900/40 border-t border-blue-500/25 transition-colors group select-none focus:outline-none focus:ring-1 focus:ring-blue-400/50',
          className
        )}
      >
        {content}
      </Link>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick || onToggle}
      className={cn(
        'w-full flex items-center justify-center py-3 px-4 bg-blue-500/[0.08] hover:bg-blue-500/[0.15] dark:bg-blue-950/30 dark:hover:bg-blue-900/40 border-t border-blue-500/25 transition-colors group select-none focus:outline-none focus:ring-1 focus:ring-blue-400/50',
        className
      )}
      aria-expanded={isExpanded}
    >
      {content}
    </button>
  );
};
