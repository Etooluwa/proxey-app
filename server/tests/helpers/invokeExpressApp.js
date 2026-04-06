import { EventEmitter } from "node:events";

export async function invokeExpressApp(
  app,
  { method = "GET", url = "/", headers = {}, ip = "127.0.0.1", body } = {}
) {
  const req = new EventEmitter();
  req.method = method;
  req.url = url;
  req.originalUrl = url;
  req.headers = headers;
  req.body = body;
  req.connection = { remoteAddress: ip };
  req.socket = { remoteAddress: ip };
  req.httpVersionMajor = 1;
  req.httpVersionMinor = 1;

  const res = new EventEmitter();
  const responseHeaders = {};
  const chunks = [];

  res.statusCode = 200;
  res.setHeader = (name, value) => {
    responseHeaders[String(name).toLowerCase()] = value;
  };
  res.getHeader = (name) => responseHeaders[String(name).toLowerCase()];
  res.getHeaders = () => ({ ...responseHeaders });
  res.removeHeader = (name) => {
    delete responseHeaders[String(name).toLowerCase()];
  };
  res.writeHead = (statusCode, headersToSet = {}) => {
    res.statusCode = statusCode;
    for (const [name, value] of Object.entries(headersToSet)) {
      res.setHeader(name, value);
    }
    return res;
  };
  res.write = (chunk) => {
    if (chunk) {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(String(chunk)));
    }
    return true;
  };
  res.end = (chunk) => {
    if (chunk) res.write(chunk);
    res.finished = true;
    res.emit("finish");
    return res;
  };

  await new Promise((resolve, reject) => {
    res.once("finish", resolve);
    res.once("error", reject);

    app.handle(req, res, (error) => {
      if (error) reject(error);
      else resolve();
    });

    req.emit("end");
  });

  const rawBody = Buffer.concat(chunks).toString("utf8");
  let jsonBody = null;

  if (rawBody) {
    try {
      jsonBody = JSON.parse(rawBody);
    } catch {
      jsonBody = null;
    }
  }

  return {
    status: res.statusCode,
    headers: responseHeaders,
    text: rawBody,
    json: jsonBody,
  };
}
