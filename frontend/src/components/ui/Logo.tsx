import { cn } from "@/lib/utils";

interface MarkProps {
  size?: number
  className?: string
}

/**
 * OrderLoop mark: circular arrow (the order state machine loop) in a
 * rounded primary-blue square. Same artwork as public/favicon.svg.
 */
export function LogoMark({ size = 40, className }: MarkProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      className={className}
      aria-hidden="true"
    >
      <rect width="32" height="32" rx="7" className="fill-action" />
      <g
        transform="translate(4 4)"
        fill="none"
        stroke="#ffffff"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8" />
        <path d="M21 3v5h-5" />
      </g>
    </svg>
  )
}

type LogoProps = {
  hideText?: boolean;
  titleOnly?: boolean;
  imageClassName?: string;
  className?: string;
}

/** Full lockup: mark + wordmark + tagline. */
export default function Logo({ hideText = false, titleOnly = false, imageClassName, className }: LogoProps) {
  return (
    <div className={cn("flex items-center gap-3", className)}>
      <LogoMark className={cn("size-16", imageClassName)} />
      <div className={`${hideText && "hidden"}`}>
        <p className="text-headline-xl text-primary">
          Order<span className="text-on-surface">Loop</span>
        </p>
        <p className={`${titleOnly && "hidden"} text-xs uppercase tracking-wide text-on-surface-variant max-w-md wrap-break-word`}>
          Streamlined procurement management for modern logistics. Simplify your ordering workflow from request to approval.
        </p>
      </div>
    </div>
  )
}
