import { Component, type ErrorInfo, type ReactNode } from 'react'
import { AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/Button'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false }

  static getDerivedStateFromError(): State {
    return { hasError: true }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-[200px] flex-col items-center justify-center gap-4 p-6">
          <AlertTriangle size={48} className="text-yellow-500" />
          <p className="text-gray-600">Что-то пошло не так</p>
          <Button onClick={() => this.setState({ hasError: false })} variant="outline">
            Попробовать снова
          </Button>
        </div>
      )
    }
    return this.props.children
  }
}
