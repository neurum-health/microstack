const qs = require("qs");

function isBoolean(val) {
  return val === "false" || val === "true";
}

function parseBoolean(val) {
  return val === "true";
}

module.exports.parseQueryString = (str) => {
  let params = qs.parse(str, {
    allowPrototypes: true,
    parseArrays: true,
  });

  for (let key in params) {
    const value = params[key];

    if (isBoolean(value)) {
      params[key] = parseBoolean(value);
    }

    if (typeof value === "object") {
      params[key] = Object.values(value);
    }
  }
  return params;
};
