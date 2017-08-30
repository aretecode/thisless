/**
 * @file side effect file, has no exports
 */
const { types } = require('mobx-state-tree')
const { selfless, thisless, isUndefined } = require('./index')

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

/**
 * @see https://github.com/mobxjs/mobx-state-tree/blob/master/src/types/complex-types/object.ts
 */
hackObjectTypePrototype(types.model({ fake: types.number }))
