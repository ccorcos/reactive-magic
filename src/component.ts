import { PureComponent } from "react"
import { DerivedValue } from "./reactive"

export default class Component<P = {}> extends PureComponent<P> {
	_view: DerivedValue<React.ReactNode>

	constructor(props: P) {
		super(props)
		this._view = new DerivedValue(() => this.view(this.props))
		this._view.dependency.add(this._update)
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
		this._view.dependency.delete(this._update)
	}

	_updating = false
	_update = () => {
		if (!this._updating) {
			this._updating = true
			setTimeout(() => {
				this.forceUpdate()
				this._updating = false
			})
		}
	}

	view(props: P): React.ReactNode {
		return null
	}

	render(): React.ReactNode {
		return this._view.get()
	}
}
