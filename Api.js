import axios from "axios";
import qs from "qs";

axios.defaults.baseURL = "/api/";

const rememberToken = (token, expiresAt) => {
  window.localStorage.setItem("api:token", token);
  window.localStorage.setItem("api:expiresAt", expiresAt);
};

const getToken = () => window.localStorage.getItem("api:token");
// const getTokenExpiresAt = () => window.localStorage.getItem("api:expiresAt");

const useToken = token => {
  if (!token) {
    token = getToken();
  }
  axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
};

const resetToken = () => {
  window.localStorage.removeItem("api:token");
  window.localStorage.removeItem("api:expiresAt");
  useToken();
};

const tokenPromise = promise => {
  promise.then(({ token, expires_at }) => {
    rememberToken(token, expires_at);
    useToken(token);
  });
  return promise;
};

class Api {
  customResolver = null;

  constructor(name = null) {
    if (name) {
      this.for(name);
    }

    this.events = {
      onSuccess: [],
      onError: [],
    };

    useToken();
  }

  setBaseUrl(url) {
    axios.defaults.baseURL = url;
  }

  /**
   * Set current module name
   * @param name Module name
   * @returns {Api}
   */
  for(name) {
    this.name = name;
    return this;
  }

  fire(eventName, args) {
    const events = this.events[eventName];
    if (events.length) {
      events.forEach(callback => callback.apply(callback, args));
    }
  }

  on(eventName, callback) {
    this.events[eventName].push(callback);
  }

  isTokenValid() {
    return !!getToken();
  }

  login(email, password) {
    return tokenPromise(
      this.for("auth").request("post", "login", {
        data: { email, password },
      })
    );
  }

  user(params) {
    return this.for("auth").request("get", "user", { params });
  }

  logout() {
    let promise = this.for("auth").request("delete", "logout");
    promise.finally(() => {
      resetToken();
    });
    return promise;
  }

  refreshToken() {
    return tokenPromise(this.for("auth").request("patch", "refresh"));
  }

  onSuccess(callback) {
    this.on("onSuccess", callback);
  }

  onError(callback) {
    this.on("onError", callback);
  }

  fetch(params) {
    return this.request("get", null, { params });
  }

  read(id, params) {
    return this.request("get", id, { params });
  }

  create(data) {
    return this.request("post", null, { data });
  }

  update(id, data) {
    return this.request("patch", id, { data });
  }

  delete(id) {
    return this.request("delete", id);
  }

  request(httpMethod, route = null, options = {}) {
    // if (this._nameStack.length > 0) {
    //   this.name = this._nameStack.pop();
    // }

    const uploadingFile = options.data ? Object.values(options.data).some(value => value instanceof File) : false;

    if (uploadingFile) {
      const requestFormData = new FormData();

      Object.entries(options.data).forEach(([key, value]) => {
        requestFormData.append(key, value);
      });

      options.data = requestFormData;
    }

    options.method = httpMethod;
    options.url = this.name + (route !== null ? `/${route}` : "");

    if (!uploadingFile) {
      if (!options.headers) {
        options.headers = {};
      }

      options.headers.Accept = "application/json";
    }

    if (uploadingFile && options.method === "patch") {
      options.method = "post";

      options.data.append("_method", "PATCH");
    }

    options.paramsSerializer = params => {
      return qs.stringify(params);
    };

    let promise = new Promise((resolve, reject) => {
      axios(options)
        .then(response => {
          this.resolve(response, resolve, reject);
        })
        .catch(error => {
          reject(error);
        });
    });

    promise
      .then(data => {
        this.fire("onSuccess", [data]);
      })
      .catch(error => {
        this.fire("onError", [error]);
      });

    return promise;
  }

  resolve(response, resolve, reject) {
    if (this.customResolver) {
      return this.customResolver(response, resolve, reject);
    }
    return response.data.success ? resolve(response.data) : reject(response.data);
  }

  setCustomResolver(cb) {
    this.customResolver = cb;
  }
}

export default Api;
