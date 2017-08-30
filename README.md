# thisless
> allow using classes as blank objects

- [statetree](./statetree.js) for [mobx-state-tree](https://github.com/mobxjs/mobx-state-tree)
- [index](./index.js) for the functions to wrap classes in `thisless`, `selfless`, or use as decorators
- [test](./test.js) for usage of the api
- [snippet](./snippet.js) all-in-one copy paste to try running it in your setup with jest


# exports 
```js
const {
  selfless,
  thisless,
  toBlankObj,
  getOwnPrototypeNames,
  NATIVE_PROPS_NON_ENUMERABLE,
  isUndefined,
} = require('thisless')

// for adding wrappers to mobx-state-tree prototype
// require('thisless/statetree')
```

# why?
- can use decorators
- no commas required
- no paren wrappers required
- can add metadata in a cleaner shorter more understandable syntax


# example 
## these are all the same

```js
// setup
const $self = {igloo: 10}
```

```js
const getPreThisLess = self => @thisless class {
  get aboot() {
    return 100
  }
  moose() {
    return self.igloo
  }
}

const getThisLessed = self => class {
  get aboot() {
    return 100
  }
  moose() {
    return self.igloo
  }
}

const getSelflessed = self => class {
  get aboot() {
    return 100
  }
  moose() {
    return self.igloo
  }
}

const getES6Obj = self => ({
  get aboot() {
    return 100
  },
  moose() {
    return self.igloo
  },
})
const getReturnedInitializedObj = self => {
  return {
    get aboot() {
      return 100
    },
    moose() {
      return self.igloo
    },
  }
}

```

## usage

```js

// common usage as objects not classes no thisless needed
const ES6Obj = getES6Obj($self)
const Initialized = getReturnedInitializedObj($self)

// to do the same as ^ with classes
const SelfLessed = selfless(getSelflessed($self))
const ThisLessed = thisless(getThisLessed($self))
const ThisLessedDecorated = getPreThisLess($self)

```