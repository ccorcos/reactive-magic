import flyd, {Stream} from "flyd";

let stack: Array<Array<Stream<any>>> = [];

export interface ReactiveValue<V> {
  (v: V | undefined ): V;
  reactive?: true;
  stop?(): void;
}

export function Value<V>(x: V): ReactiveValue<V> {
  const $ = flyd.stream(x);

  const _Value: ReactiveValue<V> = (y: V | undefined) => {
    if (y === undefined) {
      const deps = stack[0];
      deps && deps.push($);
      return $();
    } else {
      $(y);
      return;
    }
  }
  _Value.reactive = true;
  _Value.stop = () => $.end(true);
  return _Value;
}

export interface DerivedValue<V> {
  (v?: undefined): V;
  reactive?: true;
  stop?(): void;
}

export function Derive<V>(fn: () => V): DerivedValue<V> {
  stack.push([]);
  const x = fn();
  const deps = stack.shift();
  let first = true;
  const $ = flyd.combine(
    () => {
      if (first) {
        first = false;
        return x;
      }
      return fn();
    },
    deps
  );
  const _Derive: DerivedValue<V> = (y) => {
    if (y === undefined) {
      const deps = stack[0];
      deps && deps.push($);
      return $();
    } else {
      console.warn("can't set a derrived value");
      return;
    }
  }
  _Derive.reactive = true;
  _Derive.stop = () => $.end(true);
  return _Derive;
}

export function Store<S>(shape: S): S {
  const obj = {}
  Object.keys(shape).forEach(key => {
    const value = (shape as any)[key];
    const $ = value && value.reactive === true ? value : Value(value);
    Object.defineProperty(obj, key, {
      get: () => $(),
      set: x => $(x)
    });
  });
  return (obj as S);
}
