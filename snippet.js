/** 
 * @file allows using classes as blank objects
 * 
 * @example
 *   const ThisLessed = () => @thisless class ThisLessEd {
 *     get aboot() {
 *       return 100
 *     }
 *     moose() {
 *       // moose
 *     }
 *   }
 *
 * @example
 *   const Selflessed = self => class {
 *     get aboot() {
 *       return 100
 *     }
 *     moose() {
 *       // moose
 *     }
 *   }
 * 
 * @example
 *   const getInitializedObj = () => self => ({
 *     get aboot() {
 *       return 100
 *     },
 *     moose() {
 *        // moose
 *     },
 *   })
 * 
 * @example
 *   const getReturnedInitializedObj = () => self => {
 *     return {
 *       get aboot() {
 *         return 100
 *       },
 *       moose() {
 *          // moose
 *       },
 *     }
 *   }

/**
 * @param {*}
 * @return {boolean}
 */
const isUndefined = x => x === undefined

/**
 * @param {*} value 
 * @return {boolean}
 */
function isPlainObject(value) {
  if (value === null || typeof value !== 'object') return false
  const proto = Object.getPrototypeOf(value)
  return proto === Object.prototype || proto === null
}

const NATIVE_PROPS_NON_ENUMERABLE = Object.freeze([
  '__defineGetter__',
  '__defineSetter__',
  '__proto__',
  '__lookupGetter__',
  '__lookupSetter__',
  'hasOwnProperty',
  'propertyIsEnumerable',
  'toLocaleString',
  'isPrototypeOf',
  'toString',
  'constructor',
  'prototype',
  'valueOf',
  // in non-strict mode
  'arguments',
  'caller',
  'callee',
])

/**
 * @param {string} name 
 * @return {boolean} 
 */
const nameIsNotNative = name => !NATIVE_PROPS_NON_ENUMERABLE.includes(name)

/**
 * @desc gets own property names, filters out native methods
 * @param {Object} obj 
 * @return {Array<string>} 
 */
const getOwnPrototypeNames = obj =>
  Object.getOwnPropertyNames(obj).filter(nameIsNotNative)

/**
 * @desc takes all prototype methods, 
 *       sets them all to enumerable
 *       creates a blank object
 *       defines the enumerable methods on a blank object 
 * 
 * @param {Object} obj 
 * @return {BlankObject} 
 * @example Object.create(null, descriptors(obj))
 */
function toBlankObj(obj) {
  const blankObj = Object.create(null)

  getOwnPrototypeNames(obj).forEach(key => {
    const descriptor = Object.getOwnPropertyDescriptor(obj, key)
    descriptor.enumerable = true
    Object.defineProperty(blankObj, key, descriptor)
  })

  return blankObj
}

/**
 * @see toBlankObj
 * @param {Class} _class 
 * @return {BlankObject}
 */
function thisless(_class) {
  if (!isPlainObject(_class)) {
    return toBlankObj(_class.prototype)
  }
  return _class
}

/**
 * @param {Function} fn scoped reference that receives $this
 * @param {Object} self $this
 * @return {ClassPlainObj}
 * 
 * @curried 2
 * 
 * @example 
 * 
 *   self => class { 
 *     eh = () => self
 *   }
 *  
 *   //=> const blank = Object.create(null)
 *   //=> blank.eh = () => self
 *    
 *   const isBlank = blank.prototype === 
 *        blank.constructor === 
 *        blank.__proto__ === 
 *        undefined
 *    //=> true
 *   
 *    Object.keys(blank)
 *    //=> ['eh']
 * 
 */
function selfless(fn, $self) {
  // inline curry
  if (arguments.length === 1) {
    return function selflessCurry($$self) {
      const _class = fn($$self)
      return thisless(_class)
    }
  } else {
    const _class = fn($self)
    return thisless(_class)
  }
}

// ------------

const { types } = require('mobx-state-tree')

/**
 * @desc get the ObjectType prototype, 
 *       change the methods to allow using classes
 * 
 * @modifies 
 *    ObjectType.prototype.actions
 *    ObjectType.prototype.views
 *    ObjectType.prototype.createStore
 * 
 * @see thisless, selfless
 * @param {MobxStateTree.ObjectType} x internal state tree class
 * @return {void}
 */
function hackObjectTypePrototype(x) {
  // only run this once, could be done many ways
  if ('createStore' in x) return

  const ObjectTypeProto = Object.getPrototypeOf(x)
  const [actions, views] = [ObjectTypeProto.actions, ObjectTypeProto.views]

  ObjectTypeProto.actions = function(actionArgs) {
    const selflessActions = selfless(actionArgs)

    return actions.call(this, selflessActions)
  }
  ObjectTypeProto.views = function(viewArgs) {
    const selflessViews = selfless(viewArgs)

    return views.call(this, selflessViews)
  }

  /**
   * @param {Object|undefined} [data=undefined]
   * @return {Object} { model, state, store }
   */
  ObjectTypeProto.createStore = function(data = undefined) {
    // eslint-disable-next-line
    const model = this
    const state = isUndefined(data) ? this.create() : this.create(data)

    // @NOTE can debug here if needed
    // console.log(JSON.stringify(model, null, 2))

    // @NOTE as redux store
    // const store = asReduxStore(state)
    // connectReduxDevtools(remoteDev, state)
    const store = state

    return { model, state, store }
  }
}

// link to src
hackObjectTypePrototype(types.model({ fake: types.number }))

// ------- jest setup
/**
 * @NOTE this is required because
 * jest is incorrectly messing up on these descriptor values
 * 
 * @example
 *   Expected value to equal:
 *   {"eh": "eh", "foo": [Function foo]}
 *   Received:
 *   {"eh": "eh", "foo": [Function foo]}
 *   Difference:
 *   Compared values have no visual difference.
 */

const keysLength = x => Object.getOwnPropertyNames(x).length
const getDesc = Object.getOwnPropertyDescriptor
const expectEqualKeyLen = (received, expected) => {
  expect(keysLength(received)).toBe(keysLength(expected))
  return true
}
const isString = x => typeof x === 'string'
// https://github.com/infernojs/inferno/blob/master/packages/inferno-compat/lib/shallowCompare.js
function shallowInEquals(a, b) {
  if (isString(a)) return a === b
  // eslint-disable-next-line
  for (var i in a) if (!(i in b)) return false
  // eslint-disable-next-line
  // for (var i in b) if (!(i in a)) return false
  // a[i] != b[i]
  return true
}
function shallowValuesEquals(a, b) {
  return shallowInEquals(Object.values(a), Object.values(b))
}
function shallowEquals(a, b) {
  // const areEqLen = expectEqualKeyLen(a, b)
  const areEqIn = shallowInEquals(a, b)
  const areEqVals = shallowValuesEquals(a, b)
  const result = areEqIn && areEqVals
  expect(result).toEqual(true)
}
const isDescriptorEqual = property => (received, expected) => {
  const receivedDesc = getDesc(received, property)
  const expectedDesc = getDesc(expected, property)
  shallowEquals(receivedDesc, expectedDesc)
}
const expectMooseEquality = isDescriptorEqual('moose')
const expectAbootEquality = isDescriptorEqual('aboot')
// could eq permutations but KISS
const eq = (a, b) => {
  expectMooseEquality(a, b)
  expectAbootEquality(a, b)
}

// ----------- test setup

var $selfthis = {
  igloo: 'igloomoose',
}

const getPreThisLessed = () =>
  @thisless
    class ThisLessEd {
      get aboot() {
        return 100
      }
      moose() {
        return $selfthis.igloo
      }
    }

const getThisLessed = () =>
  class ThisLessEd {
    get aboot() {
      return 100
    }
    moose() {
      return $selfthis.igloo
    }
  }

const getSelflessed = self =>
  class {
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

test('selfless', () => {
  const selflessed = getSelflessed
  const blank = selfless(selflessed, $selfthis)

  expect(blank.aboot).toBe(100)
  expect(typeof blank.moose).toBe('function')
})

test('thisless', () => {
  const $thisless = thisless(getThisLessed())

  expect($thisless.aboot).toBe(100)
  expect(typeof $thisless.moose).toBe('function')
})

test('@thisless', () => {
  const $prethisless = getPreThisLessed()
  const $thisless = thisless(getThisLessed())

  eq($thisless, $prethisless)
})

test('thisless == selfless()', () => {
  const selflessed = getSelflessed
  const $self = selfless(selflessed, $selfthis)
  const $this = thisless(getThisLessed())

  eq($this, $self)
})

test('thisless == selfless == initialized', () => {
  const selflessed = getSelflessed
  const $self = selfless(selflessed, $selfthis)
  const $this = thisless(getThisLessed())
  const ES6obj = getES6Obj($selfthis)
  const initialized = getReturnedInitializedObj($selfthis)

  eq($this, $self)
  eq(initialized, ES6obj)
  eq($self, ES6obj)
  eq($this, initialized)
})

test('thisless will never allow instantiation', () => {
  const blankObj = thisless(
    class {
      get eh() {
        return 'eh'
      }
      foo() {
        // no new
      }
    }
  )
  const plainObjWithInitializer = {
    get eh() {
      return 'eh'
    },
    foo() {
      // no new
    },
  }

  expect(() => new blankObj()).toThrow()

  shallowEquals(blankObj, plainObjWithInitializer)
  shallowEquals(blankObj.eh, plainObjWithInitializer.eh)
})

/* prettier-ignore */
describe('simple usage of state tree with class actions and selectors', () => {
  /// Simple action replay and invocation
  const Task = types
    .model({
      done: false,
    })
    .actions(self => class {
      toggle() {
        self.done = !self.done
        return self.done
      }
    })
    .views(self => class {
      get doneInverted() {
        return !self.done
      }
    })

  test('it should be possible to invoke a simple action', () => {
    const state = Task.create()
    
    // direct state access
    expect(state.done).toBe(false)

    // testing class methods on views 
    expect(state.doneInverted).toBe(true)
    
    // testing class methods on actions 
    state.toggle()

    // testing updated class methods on views 
    expect(state.done).toBe(true)
    expect(state.doneInverted).toBe(false)
  })
})
