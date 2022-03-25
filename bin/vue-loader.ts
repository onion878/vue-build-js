declare const axios: any, requirejs: any, globalVersion: string;

function getVueFile(file, resolve) {
  axios.get(file + ".config.json").then(function (c) {
    const list = file.split("/");
    requirejs.config({
      baseUrl: file.replace(list[list.length - 1], ""),
      urlArgs: "version=" + (globalVersion ? globalVersion : "0")
    });
    if (c.data.length > 0) {
      const d = c.data.concat(file + ".min.js");
      importModule(d, 0, function (data) {
        loadStyle(file, data.style);
        resolve(data);
      });
    } else {
      requirejs([file + ".min.js"], function (data) {
        // main.style需要放入head里面
        loadStyle(file, data.style);
        resolve(data);
      });
    }
  });
}

function importModule(data, index, resolve) {
  requirejs([data[index]], function (d) {
    // main.style需要放入head里面
    if (index == data.length - 1) {
      resolve(d);
    } else {
      index++;
      importModule(data, index, resolve);
    }
  });
}

function loadCss(css) {
  // @ts-ignore
  return new Promise((resolve) => {
    const id = "css" + css.replace(/\./g, "").replace(/\//g, "_");
    if (document.getElementById(id) != null) {
      resolve(true);
      return;
    }
    const node = document.createElement("link");
    node.id = id;
    node.href = css;
    node.type = "text/css";
    node.rel = "stylesheet";
    document.getElementsByTagName("head")[0].appendChild(node).onload = () => {
      resolve(true);
    };
  });
}

function loadScript(js) {
  // @ts-ignore
  return new Promise((resolve) => {
    const id = "js" + js.replace(/\./g, "").replace(/\//g, "_");
    if (document.getElementById(id) != null) {
      resolve(true);
      return;
    }
    const node = document.createElement("script");
    node.id = id;
    node.src = js;
    node.type = "text/javascript";
    document.getElementsByTagName("head")[0].appendChild(node).onload = () => {
      resolve(true);
    };
  });
}

function loadStyle(id, style) {
  id = "style_" + id.replace(/\./g, "").replace(/\//g, "_");
  if (document.getElementById(id) != null) {
    document.getElementById(id).innerHTML = style;
    return;
  }
  const node = document.createElement("style");
  node.id = id;
  node.innerHTML = style;
  document.getElementsByTagName("head")[0].appendChild(node);
}