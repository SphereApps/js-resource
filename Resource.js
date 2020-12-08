import Base from './Base';
import ResourceCollection from './ResourceCollection';

class Resource extends Base {
  static collection(data = null) {
    return new ResourceCollection(data, this);
  }

  /**
   * Override: fill data
   * @param  {Object}
   */
  $fill(/*data*/) {}

  /**
   * Override: default values for new record
   * @return Object
   */
  $defaults() {
    return {};
  }

  /**
   * Default state attributes
   * @return {Object}
   */
  $defaultState() {
    return {
      loading: false,
      loaded: false,
      saving: false,
      saved: false,
      deleting: false,
      deleted: false,
    };
  }

  /**
   * Assign data from server or constructor;
   * @param  {Object} data
   */

  $assign(data) {
    this.$ = {};
    const defaults = this.$defaults();

    Object.keys(defaults).forEach(key => {
      // let val = data ? data[key] : defaults[key];
      this.$[key] = defaults[key];
      this[key] = defaults[key];
    });

    if (data) {
      const thisPrototype = Object.getPrototypeOf(this);
      Object.keys(data).forEach(key => {
        this.$[key] = data[key];

        if (Array.isArray(data[key])) {
          // @todo some deep clone library
          this.$[key] = JSON.parse(JSON.stringify(data[key]));
        }

        const descriptor = Object.getOwnPropertyDescriptor(thisPrototype, key);
        // Нет геттера для данного свойства
        if (!descriptor || !descriptor.get) {
          this[key] = data[key];
        }
      });
      this.$fill(data);
    }
  }

  /**
   * Reset record attributes to saved state
   */
  $reset() {
    this.$assign(this.$);
  }

  /**
   * Get plain object with record attributes
   * @param  {Boolean} onlyChanged Return only changed attributes
   * @return {Object}
   */
  $getData(onlyChanged = false) {
    let data = {};
    let keys = onlyChanged ? this.$changedAttributes : Object.keys(this.$);
    keys.forEach(key => {
      data[key] = this[key];
    });
    return data;
  }

  /*---------------------------------------------------------------------------
    API Methods
  ---------------------------------------------------------------------------*/

  /**
   * API: Get record by ID
   * @param  {integer} id ID
   * @return {Promise}
   */
  $find(id, params = {}) {
    return this.$api('read', id, params);
  }

  /**
   * API: Save record (create or update)
   * @return {Promise}
   */
  $save(params = {}) {
    if (this.$isNew) {
      return this.$api('create', this.$getData(), params);
    } else {
      return this.$api('update', this.id, this.$getData(true), params);
    }
  }

  /**
   * API: Delete record
   * @return {Promise}
   */
  $delete() {
    if (!this.id) {
      throw new Error('Cannot delete new resource without id attribute');
    }

    return this.$api('delete', this.id);
  }

  /*---------------------------------------------------------------------------
    Computed properties
  ---------------------------------------------------------------------------*/

  /**
   * Get array of changed attributes
   * @return {Array}
   */
  get $changedAttributes() {
    let changed = [];
    Object.keys(this.$defaults()).forEach(key => {
      const currentValue = this[key];
      // const isCollection = currentValue && currentValue.isCollection;
      // if (!isCollection) {
      const originalValue = this.$[key];

      if (Array.isArray(originalValue)) {
        // @todo some deep comparison library
        if (JSON.stringify(currentValue) !== JSON.stringify(originalValue)) {
          changed.push(key);
        }
      } else if (currentValue !== originalValue) {
        changed.push(key);
      }
      // }
    });
    return changed;
  }

  /**
   * Has changed attributes
   * @return {Boolean}
   */
  get $isNew() {
    return !this.id;
  }

  /**
   * Has changed attributes
   * @return {Boolean}
   */
  get $isChanged() {
    return this.$changedAttributes.length !== 0;
  }
}

export default Resource;
