import { Component, type ReactNode } from 'react'
import { ImageSide } from './login/ImageSide'

interface Props {
  children: ReactNode
}

interface State {
  error: Error | null
}

/**
 * Broken-robot illustration shown on the boundary's image side (desktop only).
 * Inline SVG so it needs no asset pipeline and inherits theme colors.
 */
function BrokenRobot() {
  return (
    <svg
      viewBox="0 0 240 240"
      role="img"
      aria-label="Broken robot"
      className="w-64 max-w-[70%] text-on-surface-variant"
      fill="none"
      stroke="currentColor"
      strokeWidth="4"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {/* antenna, snapped */}
      <line x1="120" y1="40" x2="120" y2="66" />
      <circle cx="120" cy="34" r="7" className="fill-error stroke-error" />
      <line x1="150" y1="34" x2="168" y2="22" className="text-error" stroke="currentColor" />
      {/* head */}
      <rect x="66" y="66" width="108" height="86" rx="14" className="fill-surface-container-high" />
      {/* eyes — one X (dead), one flat */}
      <line x1="92" y1="98" x2="108" y2="114" className="text-error" stroke="currentColor" />
      <line x1="108" y1="98" x2="92" y2="114" className="text-error" stroke="currentColor" />
      <line x1="132" y1="106" x2="152" y2="106" />
      {/* jagged mouth */}
      <polyline points="90,134 100,128 110,134 120,128 130,134 140,128 150,134" />
      {/* crack across head */}
      <polyline points="150,66 138,92 156,104 146,128" className="text-error" stroke="currentColor" strokeWidth="3" />
      {/* neck */}
      <line x1="120" y1="152" x2="120" y2="166" />
      {/* body, tilted loose bolt vibe */}
      <rect x="80" y="166" width="80" height="52" rx="10" className="fill-surface-container-high" />
      <circle cx="104" cy="192" r="5" />
      <circle cx="136" cy="192" r="5" />
    </svg>
  )
}

/**
 * Last-resort catch for render-time crashes anywhere in the tree — shows a
 * recovery screen instead of a blank page. API/query errors are handled
 * inline by each page and never reach this boundary.
 */
export default class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  render() {
    if (this.state.error) {
      return (
        <div className="flex min-h-dvh bg-surface text-on-surface">
          <div className="hidden lg:flex lg:w-1/2 lg:items-center lg:justify-center lg:bg-tertiary-surface-container">
            <ImageSide />
          </div>

          <div className="flex w-full flex-col items-center justify-center gap-5 p-8 text-center lg:w-1/2">
            <BrokenRobot />
            <h1 className="text-lg font-bold tracking-tight text-on-surface lg:text-2xl">
              Something went wrong
            </h1>
            <p className="max-w-md text-body-md text-on-surface-variant">
              {this.state.error.message}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="mt-2 rounded bg-action px-5 py-2.5 text-label-md text-on-action hover:bg-action-hover"
            >
              Reload page
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
