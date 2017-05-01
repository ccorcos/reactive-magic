// Goals:
// - simplify
//   - be clear about set and get
// - prototype methods on stores
// - reactive constraints

import flyd, {Stream} from "flyd"

const stack: Array<Array<Stream<any>>> = []

class ReactiveValue<V> {
  private stream: Stream<V>
  constructor(value: V) {
    this.stream = flyd.stream(value)
  }
  get(): V {
    const deps = stack[0]
    deps && deps.push(this.stream)
    return this.stream()
  }
  set(value: V): void {
    this.stream(value)
  }
  stop() {
    this.stream.end(true)
  }
}

class DerivedValue<V> {
  private stream: Stream<V>
  constructor(fn: () => V) {
    stack.push([])
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
      deps
    )
  }
  get(): V {
    const deps = stack[0]
    deps && deps.push(this.stream)
    return this.stream()
  }
  stop() {
    this.stream.end(true)
  }
}

class ConstrainedValue<V> {
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
  stop() {
    this.value.stop()
  }
}

//
// export function Store<S>(shape: S): S {
//   const obj = {}
//   Object.keys(shape).forEach(key => {
//     const value = (shape as any)[key]
//     const $ = value && value.reactive === true ? value : Value(value)
//     Object.defineProperty(obj, key, {
//       get: () => $(),
//       set: x => $(x)
//     })
//   })
//   return (obj as S)
// }
