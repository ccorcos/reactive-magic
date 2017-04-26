declare module "flyd" {
  interface Stream<V> {
    (v?: V): V | undefined;
    end: Stream<boolean>
  }
  function stream<V>(v?: V): Stream<V>
  function combine<V>(fn: () => V, deps: Array<Stream<any>>): Stream<V>
}
