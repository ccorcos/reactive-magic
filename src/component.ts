import { PureComponent } from "react"
import { DerivedValue } from "./reactive"

export default class Component<P> extends PureComponent<
	P,
	{ updates: number }
> {
	constructor(props: P) {
		super(props)
	}

	private _view: any
	private _needsUpdate: boolean

	// leverage React's render loop
	state = { updates: 0 }
	_update = () => {
		this.setState({ updates: this.state.updates + 1 })
	}

	// listen for reactive updates
	_listener: DerivedValue<void>

	willMount(props: P) {}
	componentWillMount() {
		this.willMount(this.props)
		let first = true
		this._listener = new DerivedValue(() => {
			this._view = this.view(this.props)
			this._needsUpdate = false
			if (first) {
				first = false
			} else {
				this._update()
			}
		})
	}

	didMount(props: P) {}
	componentDidMount() {
		this.didMount(this.props)
	}

	willUpdate(props: P) {}
	componentWillUpdate(nextProps: P, nextState: { updates: number }) {
		if (nextState.updates === this.state.updates) {
			this._needsUpdate = true
		}
		this.willUpdate(nextProps)
	}

	didUpdate(props: P) {}
	componentDidUpdate() {
		this.didUpdate(this.props)
	}

	willUnmount(props: P) {}
	componentWillUnmount() {
		this._listener.stop()
		this.willUnmount(this.props)
	}

	view(props: P): JSX.Element | null {
		return null
	}
	render() {
		if (this._needsUpdate) {
			this._view = this.view(this.props)
			this._needsUpdate = false
		}
		return this._view
	}
}
