import api from './';
import State from './State';

const statePrefixForMethod = {
  fetch: 'load',
  read: 'load',
  create: 'sav',
  update: 'sav',
  delete: 'delet',
};

const _getState = (method, end = null) => {
  const statePrefix = statePrefixForMethod[method] || 'load';
  return {
    [`${statePrefix}ing`]: end === false ? false : !end,
    [`${statePrefix}ed`]: end === false ? false : !!end,
  };
};

class Base {
  $name = null;
  $error = null;

  static make(name, data = null, state = null) {
    let obj = new this(data);
    obj.$name = name;
    if (state) {
      obj.$state.update(state);
    }
    return obj;
  }

  constructor(data = null) {
    this.$state = new State(this.$defaultState());
    this.$assign(data);
  }

  $defaultState() {
    return {
      loading: false,
      loaded: false,
    };
  }

  $api(method, ...args) {
    const apiPromise = api.for(this.$name)[method].apply(api, args);
    this.$state.update(_getState(method));
    this.$error = null;
    apiPromise
      .then(({ data }) => {
        const state = _getState(method, true);
        if (method !== 'delete') {
          this.$assign(data, state);
        }
        this.$state.update(state);
      })
      .catch(error => {
        this.$error = error;
        this.$state.update(_getState(method, false));
      });
    return apiPromise;
  }
}

export default Base;
