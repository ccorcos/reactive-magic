import { PureComponent } from "react"
import { DerivedValue } from "./reactive"

export default class Component<P> extends PureComponent<P> {
	_view: DerivedValue<JSX.Element | null>
	constructor(props: P) {
		super(props)
		this._view = new DerivedValue(() => this.view(this.props))
		this._view.dependency.add(this.forceUpdate)
	}

	willMount(props: P) {}
	componentWillMount() {
		this.willMount(this.props)
	}

	didMount(props: P) {}
	componentDidMount() {
		this.didMount(this.props)
	}

	willUpdate(props: P) {}
	componentWillUpdate(nextProps: P) {
		this._view.stale = true
		this.willUpdate(nextProps)
	}

	didUpdate(props: P) {}
	componentDidUpdate() {
		this.didUpdate(this.props)
	}

	willUnmount(props: P) {}
	componentWillUnmount() {
		this.willUnmount(this.props)
		this._view.stop()
		this._view.dependency.delete(this.forceUpdate)
	}

	view(props: P): JSX.Element | null {
		return null
	}

	render() {
		return this._view.get()
	}
}
