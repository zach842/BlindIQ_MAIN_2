import { Component, type ReactNode } from 'react';
export default class FieldBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() { return this.state.failed ? <section className="section"><h2>Field tools could not load</h2><p>Reconnect and reload to try again. You can still use the other tabs.</p><button onClick={() => window.location.reload()}>Reload app</button></section> : this.props.children; }
}
