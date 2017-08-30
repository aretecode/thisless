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

module.exports = {
  selfless,
  thisless,
  toBlankObj,
  getOwnPrototypeNames,
  NATIVE_PROPS_NON_ENUMERABLE,
  isUndefined,
}
module.exports.default = module.exports
