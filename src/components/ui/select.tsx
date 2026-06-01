import * as React from "react"
import { ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"

export interface SelectProps
  extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
}

const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, children, label, ...props }, ref) => {
    return (
      <div className="relative w-full">
        {label && (
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1 block">
            {label}
          </label>
        )}
        <div className="relative">
          <select
            className={cn(
              "flex h-9 w-full appearance-none rounded-md border border-input bg-transparent px-3 py-1 pr-10 text-sm shadow-sm transition-all focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer",
              className
            )}
            ref={ref}
            {...props}
          >
            {children}
          </select>
          <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-muted-foreground">
            <ChevronDown className="h-4 w-4" />
          </div>
        </div>
      </div>
    )
  }
)
Select.displayName = "Select"

export { Select }
// Also export a custom option wrapper just in case
export const SelectItem: React.FC<React.OptionHTMLAttributes<HTMLOptionElement>> = ({
  className,
  children,
  ...props
}) => {
  return (
    <option className={cn("bg-background text-foreground py-2", className)} {...props}>
      {children}
    </option>
  )
}
