import * as React from "react"
import { Eye, EyeOff } from "lucide-react"
import { cn } from "@/lib/utils"

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    const [show, setShow] = React.useState(false)
    const isPassword = type === "password"
    return (
      <div className={isPassword ? "relative" : undefined}>
        <input
          type={isPassword && show ? "text" : type}
          className={cn(
            "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
            className
          )}
          ref={ref}
          {...props}
        />
        {isPassword && (
          <button
            type="button"
            tabIndex={-1}
            aria-label={show ? "Hide password" : "Show password"}
            className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold shadow-sm bg-gray-100 hover:bg-gray-200 focus:bg-gray-200 text-gray-700 border border-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 dark:focus:bg-gray-700 dark:text-gray-200 dark:border-gray-700 transition-colors duration-150 outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
            onClick={() => setShow((v) => !v)}
          >
            {show ? <EyeOff className="w-4 h-4 mr-1" /> : <Eye className="w-4 h-4 mr-1" />}
            {show ? "Hide" : "Show"}
          </button>
        )}
      </div>
    )
  }
)
Input.displayName = "Input"

export { Input }
