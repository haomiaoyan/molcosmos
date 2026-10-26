import { Component, type ErrorInfo, type ReactNode } from 'react'

interface Props {
  /** Shown instead of the crashed subtree. */
  fallback: ReactNode
  children: ReactNode
}

interface State {
  failed: boolean
}

/**
 * Keeps a failure inside one 3D view from taking down the whole page.
 *
 * The molecule panel mounts a second WebGL canvas; if that context cannot be
 * created (older GPU, driver quirk, too many live contexts) React would
 * otherwise unmount the entire app and leave a black screen.
 */
export class SceneBoundary extends Component<Props, State> {
  state: State = { failed: false }

  static getDerivedStateFromError(): State {
    return { failed: true }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('3D view failed to render:', error, info.componentStack)
  }

  render() {
    return this.state.failed ? this.props.fallback : this.props.children
  }
}
