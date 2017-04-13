import flyd from "flyd";

let stack = [];

export function Value(x) {
  const $ = flyd.stream(x);
  function _Value(y) {
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

export function Derive(fn) {
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
  function _Derive(y) {
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

export function Store(shape, self) {
  const obj = self === undefined ? {} : self;
  Object.keys(shape).forEach(key => {
    const value = shape[key];
    const $ = value && value.reactive === true ? value : Value(value);
    Object.defineProperty(obj, key, {
      get: () => $(),
      set: x => $(x)
    });
  });
  return obj;
}
