import flyd, { Stream } from "flyd"

export interface Stoppable {
	stop(): void
}

export interface Gettable<V> extends Stoppable {
	get(): V
}

export interface Settable<V> extends Gettable<V>, Stoppable {
	set(v: V): void
	update(fn: (v: V) => V): void
}

// A stack of streams that are being used by the current computation
const stack: Array<Set<Stream<any>>> = []

// A wrapper around a stream that pushes the stream to the stack when it's used
export class Value<V> implements Settable<V> {
	private stream: Stream<V>
	constructor(value: V) {
		this.stream = flyd.stream(value)
	}
	get(): V {
		const deps = stack[0]
		deps && deps.add(this.stream)
		return this.stream()
	}
	set(value: V): void {
		this.stream(value)
	}
	update(fn: (v: V) => V): void {
		this.set(fn(this.get()))
	}
	assign(value: Partial<V>): void {
		this.set(Object.assign(this.get(), value))
	}
	stop() {
		this.stream.end(true)
	}
}

// A value that is derrived from other values
export class DerivedValue<V> implements Gettable<V> {
	private stream: Stream<V>
	private fn: () => V
	constructor(fn: () => V) {
		this.fn = fn
		this.rerun(this.run(), true)
	}
	run() {
		stack.push(new Set())
		const value = this.fn()
		const deps = stack.shift()
		return { deps, value }
	}
	rerun({ deps, value }: { deps: Set<Stream<any>>; value: V }, first: boolean) {
		this.stream = flyd.combine(() => {
			if (first) {
				first = false
				return value
			} else {
				const next = this.run()
				if (!equal(next.deps, deps)) {
					this.stop()
					this.rerun(next, false)
				}
				return next.value
			}
		}, Array.from(deps))
	}
	get(): V {
		const deps = stack[0]
		deps && deps.add(this.stream)
		return this.stream()
	}
	stop() {
		this.stream.end(true)
	}
}

// A reactive constraint by providing inverse functions
export class Constraint<V> implements Settable<V> {
	private value: DerivedValue<V>
	private setter: (v: V) => void
	constructor({ get, set }: { get: () => V; set: (v: V) => void }) {
		this.value = new DerivedValue(get)
		this.setter = set
	}
	get(): V {
		return this.value.get()
	}
	set(value: V): void {
		this.setter(value)
	}
	update(fn: (v: V) => V): void {
		this.set(fn(this.get()))
	}
	stop() {
		this.value.stop()
	}
}

function equal<V>(x: Set<V>, y: Set<V>) {
	if (x === y) {
		return true
	}
	if (x.size !== y.size) {
		return false
	}
	for (var value of Array.from(x)) {
		if (!y.has(value)) {
			return false
		}
	}
	return true
}
