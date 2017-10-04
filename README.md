# ✨ Reactive Magic ✨

A simple library for building reactive applications. Inspired by [Meteor's Tracker](https://docs.meteor.com/api/tracker.html) and [Flyd](https://github.com/paldepind/flyd).

This library has some very simply yet powerful internals that help you build complex applications quickly.

```sh
npm install --save reactive-magic
```

## Tutorial [[example](https://github.com/ccorcos/reactive-magic-example)]

Let's create some reactive values:

```js
import { Value } from 'reactive-magic'
const x = new Value(1)
const y = new Value(1)

console.log(y.get())
// => 1
y.set(2)
console.log(y.get())
// => 2
```

You can create a `Value` that derives from other `Value`s by passing a function to `DerivedValue`. This function will re-evaluate anytime it's dependent `Value`s change.

```js
import { DerivedValue } from 'reactive-magic'
const z = new DerivedValue(() => x.get() + y.get())
console.log(z.get())
// => 3
x.set(10)
console.log(z.get())
// => 12
```

You can also ignore the output of `DerivedValue` if you simply want to do something as a side-effect of a some `Value`s changing:


```js
new DerivedValue(() => console.log(x.get(), y.get(), z.get()))
// => 10 2 12
y(3)
// => 10 3 13
```

Note that you cannot set the value of a derived value (a `Value` created with `DerivedValue`).

This sets us up for creating a React API that feels very magical. We can create stores and use them wherever and everything will just update seamlessly.

Here's how you might create a Counter component that has a local store:

```js
import React from "react";
import { Component, Value } from "reactive-magic"

export default class Counter extends Component {
  count = new Value(0)

  increment = () => {
    this.count.update(count => count + 1);
  };

  decrement = () => {
    this.count.update(count => count - 1);
  };

  view() {
    return (
      <div>
        <button onClick={this.decrement}>{"-"}</button>
        <span>{this.count.get()}</span>
        <button onClick={this.increment}>{"+"}</button>
      </div>
    );
  }
}
```

The Component API has 4 functions.

- `willMount(props)`
- `didMount(props)`
- `willUpdate(props)`
- `didUpdate(props)`
- `willUnmount(props)`
- `view(props)`
