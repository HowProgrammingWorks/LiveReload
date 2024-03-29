'use strict';

const fs = require('node:fs');
const http = require('node:http');

const cache = new Map();
const lib = './lib/';

const cacheFile = (path) => {
  const filePath = lib + path;
  try {
    const libPath = require.resolve(filePath);
    delete require.cache[libPath];
  } catch (e) {
    return;
  }
  try {
    const mod = require(filePath);
    cache.set(path, mod);
  } catch (e) {
    cache.delete(path);
  }
};

const cacheFolder = (path) => {
  fs.readdir(path, (err, files) => {
    if (err) return;
    files.forEach(cacheFile);
  });
};

const watch = (path) => {
  fs.watch(path, (event, file) => {
    cacheFile(file);
  });
};

cacheFolder(lib);
watch(lib);

const ls = (res, list) => {
  res.write('<html>');
  for (const name of list) {
    res.write(`<li><a href="${name}/">${name}</li>`);
  }
  res.end('</html>');
};

http.createServer((req, res) => {
  const url = req.url.substring(1);
  if (!url) return ls(res, cache.keys());
  const [mod, method] = url.split('/');
  const methods = cache.get(mod);
  if (methods) {
    if (!method) return ls(res, Object.keys(methods));
    const handler = methods[method];
    if (handler) {
      res.end(handler().toString());
      return;
    }
  }
  res.end('File ' + url + 'not found');
}).listen(8000);
