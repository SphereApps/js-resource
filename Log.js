import Resource from "@/api/Resource";
import store from "@/store";
import api from "@/api";

export default class Log {
  static store(event, entity = null, payload = null) {
    const data = {
      event,
      payload,
    };

    if (entity instanceof Resource) {
      data["loggable_type"] = entity.$name;
      data["loggable_id"] = entity.id;
    }

    const user = store.getters.getUser;

    if (user) {
      data["user_id"] = user.id;
    }

    api.for("logs").create(data);
  }
}
