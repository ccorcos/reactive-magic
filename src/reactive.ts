import flyd, {Stream} from "flyd"

// There are two fundamental types of reactive values
export interface Gettable {
  get<V>(): V
  stop(): void
}

export interface Settable {
  get<V>(): V
  set<V>(v: V): void
  update<V>(fn:(v: V) => V): void
  stop(): void
}

// A stack of streams that are being used by the current computation
const stack: Array<Set<Stream<any>>> = []

// A wrapper around a stream that pushes the stream to the stack when it's used
export class Value<V> implements Settable {
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
  update(fn: (v:V) => V): void {
    this.set(fn(this.get()))
  }
  stop() {
    this.stream.end(true)
  }
}

// A value that is derrived from other values
export class DerivedValue<V> implements Gettable {
  private stream: Stream<V>
  constructor(fn: () => V) {
    stack.push(new Set())
    const value = fn()
    const deps = stack.shift()
    let first = true
    this.stream = flyd.combine(
      () => {
        if (first) {
          first = false
          return value
        }
        return fn()
      },
      Array.from(deps)
    )
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
export class Constraint<V> implements Settable {
  private value: DerivedValue<V>
  private setter: (v: V) => void
  constructor({get, set}: {get: () => V, set: (v: V) => void}) {
    this.value = new DerivedValue(get)
    this.setter = set
  }
  get(): V {
    return this.value.get()
  }
  set(value: V): void {
    this.setter(value)
  }
  update(fn: (v:V) => V): void {
    this.set(fn(this.get()))
  }
  stop() {
    this.value.stop()
  }
}
