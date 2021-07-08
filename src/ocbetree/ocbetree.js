// @flow
let ocbetreeInstance;

class Ocbetree {
  constructor() {
    this.context = {
      repository: undefined,
      cache: {},
    };
    onLocationChanged((href, oldHref) => {
      requestIdleCallback(() => {
        this.handleLocationChanged(href, oldHref);
      });
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

    if (!OcbetreeUtils.isBlob(this.context.repository, path)) {
      return;
    }

    const cloneContainer = OcbetreeUtils.cloneElement(
      OcbetreeConstants.GITHUB.BLOB_CONTAINER
    );
    const $parent = $(OcbetreeConstants.GITHUB.BLOB_CONTAINER).parent();

    OcbetreeUtils.removeAllAttrs(OcbetreeConstants.GITHUB.BLOB_CONTAINER);
    $(OcbetreeConstants.GITHUB.BLOB_CONTAINER).attr(
      OcbetreeConstants.GITHUB.TAB_ATTR,
      path
    );
    $parent.prepend(cloneContainer);
    this.assign({
      cache: Object.assign(this.context.cache, {
        [path]: true,
      }),
    });
  }

  isCached(path) {
    return this.context.cache[path];
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
