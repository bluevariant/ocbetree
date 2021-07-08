// @flow
let ocbetreeInstance;

class Ocbetree {
  constructor() {
    this.context = {
      repository: undefined,
      cache: {},
    };
    onLocationChanged((href, oldHref) => {
      requestIdleCallback(
        () => {
          this.handleLocationChanged(href, oldHref);
        },
        { timeout: 1000 }
      );
    });
  }

  handleLocationChanged(href) {
    const url = new URL(href);
    const path = OcbetreeUtils.getPathWithoutAnchor(url.pathname);

    this.handleCache(path);
  }

  handlePjaxEvent(event, octotreeEventName, pjaxEventName) {
    const url = new URL(location.href);
    const path = OcbetreeUtils.getPathWithoutAnchor(url.pathname);

    if (["pjax:end"].includes(pjaxEventName)) {
      this.handleCache(path);
    }
  }

  handleCache(path) {
    if (this.context.cache[path]) return;

    const $contentElement = $(`[${OcbetreeConstants.GITHUB.TAB_ATTR}]`);

    if (!OcbetreeUtils.isBlob(this.context.repository, path)) {
      $(OcbetreeConstants.GITHUB.BLOB_CONTAINER).removeAttr("style");
      $contentElement.attr("style", "display:none");

      return;
    }

    const $parent = $(OcbetreeConstants.GITHUB.BLOB_CONTAINER).parent();
    const element = document.createElement("div");

    $contentElement.attr("style", "display:none");
    // element.setAttribute("style", "display:none");
    element.setAttribute(OcbetreeConstants.GITHUB.TAB_ATTR, path);
    $parent.append(element);
    $(element).html($(OcbetreeConstants.GITHUB.BLOB_CONTAINER).html());
    $(OcbetreeConstants.GITHUB.BLOB_CONTAINER).attr("style", "display:none");
    this.assign({
      cache: Object.assign(this.context.cache, {
        [path]: {
          title: document.title,
        },
      }),
    });
  }

  isCached(path) {
    return this.context.cache[path];
  }

  restoreFromCache(path) {
    path = OcbetreeUtils.getPathWithoutAnchor(path);

    if (this.context.cache[path]) {
      const query = `[${OcbetreeConstants.GITHUB.TAB_ATTR}="${path}"]`;

      $(OcbetreeConstants.GITHUB.BLOB_CONTAINER).attr("style", "display:none");
      $(`[${OcbetreeConstants.GITHUB.TAB_ATTR}]`).attr("style", "display:none");
      $(query).removeAttr("style");
      history.pushState({}, null, path);
      document.title = this.context.cache[path].title;

      return true;
    }

    return false;
  }

  assign(context = {}) {
    this.context = Object.assign(this.context, context);

    console.log(this.context);

    return this;
  }
}

Ocbetree.invoke = function () {
  if (!ocbetreeInstance) {
    ocbetreeInstance = new Ocbetree();
  }

  return ocbetreeInstance;
};

function onLocationChanged(callback) {
  // https://stackoverflow.com/a/68014751/6435579
  window.addEventListener(
    "load",
    function () {
      let oldHref = null;
      let bodyDOM = document.querySelector("body");
      const observer = new MutationObserver(function () {
        if (oldHref !== document.location.href) {
          if (typeof callback === "function") {
            callback(document.location.href, oldHref);
          }

          oldHref = document.location.href;

          window.requestAnimationFrame(function () {
            const tmp = document.querySelector("body");

            if (tmp !== bodyDOM) {
              bodyDOM = tmp;
              observer.observe(bodyDOM, config);
            }
          });
        }
      });
      const config = {
        childList: true,
        subtree: true,
      };

      observer.observe(bodyDOM, config);
    },
    true
  );
}
