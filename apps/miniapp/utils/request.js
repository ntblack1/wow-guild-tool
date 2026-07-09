const { getApiBaseUrl } = require("./api-config");

const buildUrl = (path, query) => {
  const apiBaseUrl = getApiBaseUrl();
  if (!apiBaseUrl) {
    throw {
      message: "体验版或正式版后端 HTTPS 地址未配置",
      code: "API_BASE_URL_NOT_CONFIGURED"
    };
  }
  const url = `${apiBaseUrl}${path}`;
  if (!query) {
    return url;
  }
  const params = Object.keys(query)
    .filter((key) => query[key] !== undefined && query[key] !== "")
    .map((key) => `${encodeURIComponent(key)}=${encodeURIComponent(query[key])}`)
    .join("&");
  return params ? `${url}?${params}` : url;
};

const request = ({ path, method = "GET", data, query }) =>
  new Promise((resolve, reject) => {
    let url = "";
    try {
      url = buildUrl(path, query);
    } catch (error) {
      reject(error);
      return;
    }
    wx.request({
      url,
      method,
      data,
      header: {
        "content-type": "application/json"
      },
      success: (response) => {
        const body = response.data || {};
        if (body.success) {
          resolve(body.data);
          return;
        }
        reject(body.error || { message: "\u8bf7\u6c42\u5931\u8d25", code: "REQUEST_FAILED" });
      },
      fail: (error) => {
        const detail = error && error.errMsg ? `（${error.errMsg}）` : "";
        reject({
          message: `后端未连接：${url}${detail}`,
          code: "NETWORK_ERROR"
        });
      }
    });
  });

module.exports = {
  request,
  getApiBaseUrl
};
