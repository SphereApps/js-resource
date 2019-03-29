import Vue from 'vue';

class State {
  constructor(state = null) {
    this.update(state);

    // // fetch, read
    // this.loading = state.loading || false;
    // this.loaded = state.loaded || false;
    // // save, create
    // this.saving = state.saving || false;
    // this.saved = state.saved || false;
    // // delete
    // this.deleting = state.deleting || false;
    // this.deleted = state.deleted || false;
  }

  set(name, value) {
    Vue.set(this, name, value);
  }

  update(state) {
    Object.keys(state).forEach(name => {
      this.set(name, state[name]);
    });
  }
}

export default State;
