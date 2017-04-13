# ✨ Reactive Magic ✨

A simple library for building reactive applications. Inspired by [Meteor's Tracker](https://docs.meteor.com/api/tracker.html) and built on top of the incredibly lightweight observable streams library, [Flyd](https://github.com/paldepind/flyd).

This library has some very simply yet powerful internals that help you build complex applications quickly.

```sh
npm install --save reactive-magic
```

## Tutorial [[example]()]

Let's create some reactive values:

```js
import { Value } from 'reactive-magic'
const x = Value(1)
const y = Value(1)
```

You can get a the value of a `Value` by calling it as a function with no arguments, and you can set the value of a `Value` by passing an argument to the function.

```js
console.log(y())
// => 1
y(2)
console.log(y())
// => 2
```

You can create a `Value` that derives from other `Value`s by passing a function to `Derive`. This function will re-evaluate anytime it's dependent `Value`s change.

```js
import { Derive } from 'reactive-magic'
const z = Derive(() => x() + y())
console.log(z())
// => 3
x(10)
console.log(z())
// => 12
```

You can also ignore the output of `Derive` if you simply want to do something as a side-effect of a some `Value`s changing:

```js
Derive(() => console.log(x(), y(), z()))
// => 10 2 12
y(3)
// => 10 3 13
```

Note that you cannot set the value of a derived value (a `Value` created with `Derive`).

A `Store` is just some sugar around creating an object with reactive values so that you can set and get values as you normally would in JavaScript.

```js
const NumberStore = Store({ x: 1, y: 1 })
console.log(NumberStore.x, NumberStore.y)
// => 1 1

const MathStore = Store({
  add: Derive(() => NumberStore.x + NumberStore.y)
  multiply: Derive(() => NumberStore.x * NumberStore.y)
})
console.log(MathStore.add, MathStore.multiply)
// => 2 1

NumberStore.x = 10
console.log(MathStore.add, MathStore.multiply)
// => 11 10
```

This sets us up for creating a React API that feels very magical. We can create stores and use them wherever and everything will just update seamlessly.

Here's how you might create a Counter component that has a local store:

```js
import React from "react";
import { Component, Store } from "reactive-magic"

export default class Counter extends Component {
  store = Store({ count: 0 });

  increment = () => {
    this.store.count += 1;
  };

  decrement = () => {
    this.store.count -= 1;
  };

  view() {
    return (
      <div>
        <button onClick={this.decrement}>{"-"}</button>
        <span>{this.store.count}</span>
        <button onClick={this.increment}>{"+"}</button>
      </div>
    );
  }
}
```

The Component API has 4 functions.

- `willMount(props)` is magically reactive
- `didMount(props)` is magically reactive
- `willUnmount(props)` is not reactive
- `view(props)` is magically reactive

"Magically reactive" means that those functions are run within a `Derive` context so they will be reactively re-run should any of it's dependent values change.

These stores are very convenient for global singletons as well. If we know that we're going to need to know the user's mouse location in a bunch of places, we can create a MouseStore and write to it on `mousemove`.


```js
import { Store } from "reactive-magic";

const MouseStore = Store({ x: 0, y: 0 });

document.addEventListener("mousemove", function(event) {
  MouseStore.x = event.clientX;
  MouseStore.y = event.clientY;
});
```

If we have a component that wants to use this mouse information, we can just use it and everything will magically work!

```js
import React from "react";
import { Component } from "reactive-magic";

const r = 10;

class Ball extends Component {
  getStyle() {
    return {
      position: "absolute",
      top: MouseStore.y - r,
      left: MouseStore.x - r,
      width: r * 2,
      height: r * 2,
      borderRadius: r,
      backgroundColor: "blue",
      pointerEvents: "none"
    };
  }
  view() {
    return <div style={this.getStyle()} />;
  }
}
```
