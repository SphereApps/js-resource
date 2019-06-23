import Base from "./Base";
import Resource from "./Resource";

class ResourceCollection extends Base {
  $model = Resource;
  isCollection = true;
  // items = [];

  constructor(data = null, $model = null) {
    super();
    this.$model = $model;
    this.$name = new $model().$name;
    this.$assign(data);
  }

  /**
   * Assign data from server or constructor;
   * @param  {Array} data
   * @param  {Object} newState State for Resource record
   */
  $assign(data, newState = null) {
    if (newState) {
      newState.saved = newState.loaded;
    }

    let items = [];
    if (data && data.length) {
      data.forEach(item => {
        items.push(this.$model.make(this.$name, item, newState));
      });
    }

    this.items = items;
  }

  /**
   * API: Fetch records
   * @param  {Object} Query params
   * @return {Promise}
   */
  $fetch(params = {}) {
    return this.$api("fetch", params);
  }

  $delete(record) {
    if (typeof record === "number") {
      record = this.find(record);
    }
    const recordId = record.id;
    if (recordId) {
      const foundRecord = this.find("id", recordId);
      if (foundRecord) {
        this.remove("id", recordId);
        foundRecord.$delete();
      }
    }
  }

  /**
   * Возвращает true если один из элементов колекции был изменен
   * @return {Boolean}
   */
  get $isChanged() {
    for (var i = this.items.length - 1; i >= 0; i--) {
      const item = this.items[i];
      if (item.$isChanged) {
        return true;
      }
    }
    return false;
  }

  /****************************************************************************
    Collection methods
  ****************************************************************************/

  /**
   * Добавление объекта в коллекцию. Можно передать как простой объект так и элемент Resource
   */
  add(data) {
    let record = data.$name ? data : this.$model.make(this.$name, data);
    this.items.push(record);

    return record;
  }

  /**
   * Кол-во элементов в коллекции
   * @return {Number}
   */
  count() {
    return this.items.length;
  }

  /**
   * Поиск первого найденного индекса для заданного field=value
   * @param  {String|Number} field Название поля по которому осуществляется поиск. Или идентификатор объекта
   * @param  {mixed} value Значение поля
   * @param  {Number} skip Количество элементов которые нужно пропустить при поиске
   * @return {Number}
   */
  findIndex(field, value, skip = 0) {
    if (arguments.length === 1) {
      value = +field;
      field = "id";
    }

    for (let i = skip; i < this.items.length; i++) {
      let item = this.items[i];
      if (item[field] === value) {
        return i;
      }
    }

    return -1;
  }

  /**
   * Первый элемент коллекции
   * @return {Resource}
   */
  first() {
    return this.items.length ? this.items[0] : null;
  }

  /**
   * Последний элемент коллекции
   * @return {Resource}
   */
  last() {
    return this.items.length ? this.items[this.items.length - 1] : null;
  }

  /**
   * Поиск первой записи по значению. Если передан один параметр то ищет по id
   * @param  {String|Number} field Название поля по которому осуществляется поиск. Или идентификатор объекта
   * @param  {mixed} value Значение поля
   * @return {Resource|null}
   */
  find(/*field, value*/) {
    const index = this.findIndex.apply(this, arguments);
    if (index != -1) {
      return this.items[index];
    }
    return null;
  }

  remove(/*field, value*/) {
    const index = this.findIndex.apply(this, arguments);
    if (index != -1) {
      this.items.splice(index, 1);
    }
  }

  /**
   * Возвращает true в случае если в колекции есть объект с парой field == value
   * @param  {String|Number} field Название поля по которому осуществляется поиск. Или идентификатор объекта
   * @param  {mixed} value Значение поля
   * @return {Boolean}
   */
  has(/*field, value*/) {
    return this.findIndex.apply(this, arguments) !== -1;
  }

  /**
   * Фильтр записей по нескольким параметрам
   * @param  {Object} query
   * @return {Array}
   */
  filter(query, strict = true) {
    return this.items.filter(item => {
      const keys = Object.keys(query);
      for (var i = keys.length - 1; i >= 0; i--) {
        let key = keys[i];
        let val = query[key];
        if ((strict && item[key] !== val) || (!strict && item[key] != val)) {
          return false;
        }
      }
      return true;
    });
  }
}

export default ResourceCollection;
