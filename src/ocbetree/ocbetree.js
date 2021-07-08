// @flow
let ocbetreeInstance;

class Ocbetree {
  constructor() {
    this.context = {
      repository: undefined,
      cache: {},
      isFirstLoad: true,
    };
    onLocationChanged((href, oldHref) => {
      requestIdleCallback(() => {
        if (this.context.isFirstLoad) {
          this.handleLocationChanged(href, oldHref);
        }

        this.context.isFirstLoad = false;
      });
      requestIdleCallback(() => this.makingTabs(), { timeout: 1000 });
    });
    $(window).on("scroll", (e) => this.handleScroll(e));
  }

  makingTabs(path) {
    path = OcbetreeUtils.getPathWithoutAnchor(path);

    const $container = $(OcbetreeConstants.GITHUB.MAIN);
    const containerClass = "ocbetree-tabs";

    if (!$container) return;

    let $1 = $("." + containerClass);

    if (!this.isWorkingOnRepo()) {
      $1.remove();

      return;
    }

    if ($1.length === 0) {
      const $tabs = $(`<div class="${containerClass}"></div>`);

      $tabs.prepend(
        '<div class="welcome">Ocbetree <span>🌼</span> with love!</div>'
      );
      $container.prepend($tabs);

      const $window = $(window);

      window.scrollTo(
        $window.scrollLeft(),
        $window.scrollTop() - OcbetreeConstants.GITHUB.TABS_HEIGHT
      );

      $1 = $tabs;
    }
  }

  isWorkingOnRepo() {
    if (!this.context.repository) return false;

    const path = OcbetreeUtils.getPathWithoutAnchor();
    const repo = this.context.repository;

    return path.startsWith(`/${repo.username}/${repo.reponame}`);
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
    } else if (["pjax:start"].includes(pjaxEventName)) {
      this.fixFooter();
    }
  }

  handleCache(path) {
    const $contentElements = $(`[${OcbetreeConstants.GITHUB.TAB_ATTR}]`);
    const $mainContent = $(OcbetreeConstants.GITHUB.BLOB_CONTAINER);

    if (!OcbetreeUtils.isBlob(this.context.repository, path)) {
      $mainContent.removeAttr("style");
      $contentElements.attr("style", "display:none");
      this.makingTabs(path);

      return;
    }

    if (this.context.cache[path]) return;

    const $parent = $mainContent.parent();
    const element = document.createElement("div");
    const $window = $(window);

    $contentElements.attr("style", "display:none");
    element.setAttribute(OcbetreeConstants.GITHUB.TAB_ATTR, path);
    $parent.append(element);
    $(element).html($mainContent.html());
    $mainContent.attr("style", "display:none");
    this.makingTabs(path);
    this.assign({
      cache: Object.assign(this.context.cache, {
        [path]: {
          title: document.title,
          scroll: {
            x: $window.scrollLeft(),
            y: $window.scrollTop(),
          },
        },
      }),
    });

    if (this.context.isFirstLoad) {
      this.fixFooter();
      window.scrollTo({
        top: this.calcScrollTo(path),
        left: 0,
        behavior: "smooth",
      });
    }
  }

  handleScroll() {
    const path = OcbetreeUtils.getPathWithoutAnchor();

    if (this.context.cache[path]) {
      const $window = $(window);
      const x = $window.scrollLeft();
      const y = $window.scrollTop();

      this.context.cache[path].scroll.x = x;
      this.context.cache[path].scroll.y = y;
    }
  }

  fixFooter() {
    const defaultScroll = this.defaultScroll();

    $("body").css("min-height", `calc(100vh + ${defaultScroll}px)`);
  }

  calcScrollTo(path) {
    path = OcbetreeUtils.getPathWithoutAnchor(path);

    if (!OcbetreeUtils.isBlob(this.context.repository, path)) return 0;

    const defaultScroll = this.defaultScroll();
    const cacheData = this.context.cache[path];
    let pathScroll = 0;

    if (cacheData) {
      pathScroll = cacheData.scroll.y;
    }

    return Math.max(pathScroll, defaultScroll);
  }

  defaultScroll() {
    const github = OcbetreeConstants.GITHUB;

    return github.INITIAL_SCROLL_TOP;
  }

  isCached(path) {
    return this.context.cache[path];
  }

  restoreFromCache(path) {
    path = OcbetreeUtils.getPathWithoutAnchor(path);

    const cacheData = this.context.cache[path];

    if (cacheData) {
      const query = `[${OcbetreeConstants.GITHUB.TAB_ATTR}="${path}"]`;
      const $query = $(query);

      if (!OcbetreeUtils.isBlob(this.context.repository, path)) {
        $query.remove();

        return false;
      }

      $(OcbetreeConstants.GITHUB.BLOB_CONTAINER).attr("style", "display:none");
      $(`[${OcbetreeConstants.GITHUB.TAB_ATTR}]`).attr("style", "display:none");
      $query.removeAttr("style");
      history.pushState({}, null, path);
      this.fixFooter();
      window.scrollTo(cacheData.scroll.x, this.calcScrollTo(path));
      this.makingTabs(path);

      document.title = cacheData.title;

      return true;
    }

    this.makingTabs(path);

    return false;
  }

  assign(context = {}) {
    this.context = Object.assign(this.context, context);

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
