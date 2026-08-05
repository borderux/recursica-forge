/**
 * AdapterErrorBoundary
 *
 * Wraps each component rendered from @recursica/mantine-adapter so a prop-contract
 * mismatch degrades to a visible marker instead of unmounting the whole route.
 *
 * This matters because Forge's dispatchers were written against Forge's own local
 * Mantine implementations, and the real adapter has a different API in places. A single
 * mismatch (e.g. passing `items` where Mantine wants `data`, which throws inside
 * SegmentedControl) would otherwise hit React Router's ErrorBoundary and blank the page —
 * hiding every other component you were trying to inspect.
 *
 * The boundary does not swallow the problem: it renders a labelled marker and logs the
 * error, so a broken component is obvious both on screen and in the console.
 */

import { Component, type ErrorInfo, type ReactNode } from 'react'

interface Props {
  componentName: string
  children?: ReactNode
}

interface State {
  error: Error | null
}

export class AdapterErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error(
      `[adapter] <${this.props.componentName}> from @recursica/mantine-adapter threw while rendering. ` +
        `This is usually a prop-contract mismatch between Forge's dispatcher and the real adapter.`,
      error,
      info.componentStack
    )
  }

  render() {
    const { error } = this.state
    if (!error) return this.props.children

    return (
      <span
        data-adapter-error={this.props.componentName}
        title={`${this.props.componentName}: ${error.message}`}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 4,
          padding: '2px 6px',
          border: '1px dashed #c92a2a',
          borderRadius: 4,
          background: '#fff5f5',
          color: '#c92a2a',
          font: '500 11px/1.4 ui-monospace, monospace',
          whiteSpace: 'nowrap',
          maxWidth: '100%',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}
      >
        ⚠ {this.props.componentName}: {error.message}
      </span>
    )
  }
}
