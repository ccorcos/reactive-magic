import { PureComponent } from "react";
import { Derive } from "./reactive";

export default class Component extends PureComponent {
  // compute the first _view
  constructor(props) {
    super(props);
  }

  // leverage React's render loop
  state = { updates: 0 };
  _update = () => {
    this._view = this.view(this.props);
    this.setState({ updates: this.state.updates + 1 });
  };

  // listen for reactive updates
  _listeners = [];
  _listen = fn => {
    let first = true;
    this._listeners.push(
      Derive(() => {
        fn();
        if (first) {
          first = false;
        } else {
          this._update();
        }
      })
    );
  };

  willMount() {}
  componentWillMount() {
    this._listen(() => {
      this._view = this.view(this.props);
    });
    this._listen(() => this.willMount(this.props));
  }

  didMount() {}
  componentDidMount() {
    this._listen(() => this.didMount(this.props));
  }

  willUnmount() {}
  componentWillUnmount() {
    this._listeners.forEach(l => l.stop());
    this.willUnmount(this.props);
  }

  view() {
    return false;
  }
  render() {
    return this._view;
  }
}
