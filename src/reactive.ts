export interface Gettable<V> {
	get(): V
}

export interface Settable<V> extends Gettable<V> {
	set(v: V): void
}

// Basic event emitter to keep track of dependencies
export class Dependency {
	private listeners: Set<() => void> = new Set()
	add(listener: () => void) {
		this.listeners.add(listener)
	}
	delete(listener: () => void) {
		this.listeners.delete(listener)
	}
	emit() {
		this.listeners.forEach(listener => listener())
	}
}

// A stack of dependencies that represent every .get() during a computation
const computations: Array<Set<Dependency>> = []

// Adds its dependency to the currrent computation on .get() and emits on .set()
export class Value<V> implements Settable<V> {
	private value: V
	private dependency = new Dependency()
	constructor(value: V) {
		this.value = value
	}
	get(): V {
		const computation = computations[0]
		computation && computation.add(this.dependency)
		return this.value
	}
	set(value: V): void {
		this.value = value
		this.dependency.emit()
	}
	update(fn: (v: V) => V): void {
		this.set(fn(this.get()))
	}
	assign(value: Partial<V>): void {
		this.set(Object.assign(this.get(), value))
	}
}

// A value that is derrived from other values
export class DerivedValue<V> implements Gettable<V> {
	private value: V
	dependency = new Dependency()
	private computation = new Set<Dependency>()
	private fn: () => V
	stale = true
	constructor(fn: () => V) {
		this.fn = fn
	}
	run() {
		computations.push(new Set())
		this.value = this.fn()
		const computation = computations.shift()
		this.stop()
		computation.forEach(dep => dep.add(this.onUpdate))
		this.computation = computation
	}
	onUpdate = () => {
		this.stale = true
		this.dependency.emit()
	}
	flush() {
		if (this.stale) {
			this.stale = false
			this.run()
		}
	}
	get(): V {
		this.flush()
		const deps = computations[0]
		deps && deps.add(this.dependency)
		return this.value
	}
	stop() {
		this.computation.forEach(dep => dep.delete(this.onUpdate))
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
