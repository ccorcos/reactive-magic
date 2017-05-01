import { PureComponent } from "react";
import { DerivedValue } from "./reactive";

export default class Component<P> extends PureComponent<P, {updates: number}> {
  constructor(props: P) {
    super(props);
  }

  private _view: any;
  private _needsUpdate: boolean;

  // leverage React's render loop
  state = { updates: 0 };
  _update = () => {
    this._needsUpdate = true
    this.setState({ updates: this.state.updates + 1 });
  };

  // listen for reactive updates
  _listeners : Array<DerivedValue<any>>  = [];
  _listen = (fn: () => void) => {
    let first = true;
    this._listeners.push(
      new DerivedValue(() => {
        fn();
        if (first) {
          first = false;
        } else {
          this._update();
        }
      })
    );
  };

  willMount(props: P) {}
  componentWillMount() {
    this._listen(() => {
      this._view = this.view(this.props);
    });
    this._listen(() => this.willMount(this.props));
  }

  didMount(props: P) {}
  componentDidMount() {
    this._listen(() => this.didMount(this.props));
  }

  willUpdate(props: P) {}
  componentWillUpdate(nextProps: P) {
    this._needsUpdate = true;
    this.willUpdate(nextProps);
  }

  willUnmount(props: P) {}
  componentWillUnmount() {
    this._listeners.forEach(l => l.stop());
    this.willUnmount(this.props);
  }

  view(props: P): JSX.Element | null {
    return null;
  }
  render() {
    if (this._needsUpdate) {
      this._view = this.view(this.props);
      this._needsUpdate = false;
    }
    return this._view;
  }
}
