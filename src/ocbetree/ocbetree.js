let ocbetreeInstance;

class Ocbetree {
  constructor() {
    this.context = {
      repository: undefined,
    };
    onLocationChanged(this.onLocationChanged);
  }

  onLocationChanged(href) {
    const url = new URL(href);
    const path = OcbetreeUtils.getPathWithoutAnchor(url.pathname);

    console.log(OcbetreeConstants.GITHUB.BLOB_CONTAINER);
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
      const observer = new MutationObserver(function (mutations) {
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
