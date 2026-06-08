import { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props { children: ReactNode }
interface State { hasError: boolean }

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State { return { hasError: true }; }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('AzGallery render error', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <main className="fatal-state">
          <h1>تعذر عرض الصفحة.</h1>
          <p>حدث خطأ غير متوقع أثناء تحميل واجهة المعرض.</p>
          <button className="button button--primary" type="button" onClick={() => window.location.reload()}>إعادة التحميل</button>
        </main>
      );
    }
    return this.props.children;
  }
}
