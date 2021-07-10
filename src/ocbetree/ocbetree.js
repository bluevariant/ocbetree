// @flow
let ocbetreeInstance;

class Ocbetree {
  constructor() {
    this.tree = undefined;
    this.adapter = undefined;
    this.context = {
      repository: undefined,
      cache: {},
      isFirstLoad: true,
      tabs: [],
      tabHistory: [],
    };
    onLocationChanged((href, oldHref) => {
      requestIdleCallback(() => {
        if (this.context.isFirstLoad) {
          this.handleLocationChanged(href, oldHref);
        }

        this.context.isFirstLoad = false;
      });
      requestIdleCallback(() => this.makingTabs(), { timeout: 1000 });
      OcbetreeUtils.selectPath(this.tree.$jstree, [
        OcbetreeUtils.getCurrentPath(),
      ]);
    });
    $(window).on("scroll", (e) => this.handleScroll(e));
  }

  async init() {}

  async save() {}

  setAdapter(adapter) {
    this.adapter = adapter;
  }

  addOrUpdateTab(path, temp) {
    path = OcbetreeUtils.getPathWithoutAnchor(path);

    let tabData;
    const index = _.findIndex(this.context.tabs, (v) => v.path === path);

    if (index === -1) {
      let tempIndex = _.findIndex(this.context.tabs, (v) => v.temp === true);
      const data = {
        name: path.split("/").pop(),
        path: path,
        temp: !!temp,
      };

      if (tempIndex === -1) {
        this.context.tabs.push(data);
      } else {
        this.context.tabs[tempIndex] = data;
      }
    } else {
      tabData = this.context.tabs[index];

      if (tabData.temp) {
        tabData.temp = !!temp;
      }

      this.context.tabs[index] = tabData;
    }

    this.cleanTabHistory();

    if (this.context.tabHistory[0] !== path) {
      this.context.tabHistory.unshift(path);
    }

    if (this.context.tabHistory.length > 99) {
      this.context.tabHistory.pop();
    }
  }

  cleanTabHistory() {
    for (let i = this.context.tabHistory.length - 1; i >= 0; i--) {
      const path = this.context.tabHistory[i];
      const index = _.findIndex(this.context.tabs, (v) => v.path === path);

      if (index === -1) this.context.tabHistory.splice(i, 1);
    }
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

      $tabs.append(
        '<div class="welcome">Ocbetree <span>🌼</span> with love!</div>'
      );
      $tabs.append('<div class="tabs"></div>');
      $container.prepend($tabs);

      const $window = $(window);

      window.scrollTo(
        $window.scrollLeft(),
        $window.scrollTop() - OcbetreeConstants.GITHUB.TABS_HEIGHT
      );

      $1 = $tabs;
    }

    if (OcbetreeUtils.isBlob(this.context.repository, path)) {
      this.addOrUpdateTab(path, true);
    }

    const $tabs = $1.find(".tabs");
    const tabs = this.context.tabs;
    const maxWidth = 100 / tabs.length;
    const _renderTab = (tab) => {
      const isActive = tab.path === path;
      const itemClass = isActive ? "item active" : "item";
      const contentClass = tab.temp ? "content temp" : "content";

      return `
        <div class="${itemClass}" style="max-width: ${maxWidth}%" title="${tab.name}" data-path="${tab.path}">
          <div class="${contentClass}">${tab.name}</div>
          <div class="actions"><span data-action="remove" data-path="${tab.path}">✕</span></div>
        </div>
      `;
    };

    $tabs.html(tabs.map(_renderTab).join(""));
    $tabs.sortable({
      axis: "x",
      items: ".item",
      distance: 6,
      scroll: false,
      stop: () => {
        const paths = {};

        $tabs.find(".item").each(function (i) {
          paths[$(this).attr("data-path")] = i;
        });

        this.context.tabs.sort((a, b) => paths[a.path] - paths[b.path]);
        this.makingTabs(path);
      },
    });

    const self = this;
    const $items = $tabs.find(".item");
    const $closeButtons = $tabs.find('[data-action="remove"]');
    const _remove = (path, isActive) => {
      const index = _.findIndex(self.context.tabs, (v) => v.path === path);

      if (index === -1) return;

      self.context.tabs.splice(index, 1);
      self.cleanTabHistory();

      if (isActive) {
        if (self.context.tabHistory[0]) {
          self.adapter.selectFile(self.context.tabHistory[0]);
        } else {
          if (self.context.tabs.length <= 1) {
            self.makingTabs();
          } else {
            self.adapter.selectFile(
              self.context.tabs[Math.max(index - 1, 0)].path
            );
          }
        }
      } else {
        self.makingTabs();
      }
    };

    $closeButtons.off("click");
    $closeButtons.on("click", function (e) {
      e.stopPropagation();

      const dataPath = $(this).attr("data-path");

      _remove(dataPath, dataPath === path);
    });
    $items.off("click");
    $items.on("click", function () {
      const path = $(this).attr("data-path");

      self.adapter.selectFile(path);
    });
    $items.off("dblclick");
    $items.on("dblclick", function () {
      const path = $(this).attr("data-path");

      self.addOrUpdateTab(path, false);
      self.makingTabs(path);
    });
    $items.off("mousedown");
    $items.on("mousedown", function (e) {
      if (e.which === 2) {
        e.preventDefault();
      }
    });
    $items.off("mouseup");
    $items.on("mouseup", function (e) {
      if (e.which === 2) {
        const dataPath = $(this).attr("data-path");

        _remove(dataPath, dataPath === path);
      }
    });
    this.fixMdHeader();
  }

  cleanCache() {
    const exists = {};

    _.forEach(this.context.tabs, (v) => {
      exists[v.path] = true;
    });

    _.forEach(this.context.cache, (v, k) => {
      if (!exists[k]) {
        $(`[${OcbetreeConstants.GITHUB.TAB_ATTR}="${k}"]`).remove();

        delete this.context.cache[k];
      }
    });
  }

  fixMdHeader() {
    if (!this._fixMdHeader) {
      this._fixMdHeader = _.throttle(() => {
        const $mdHeader = $("div[data-original-top]");

        if ($mdHeader.length > 0) {
          $mdHeader.attr(
            "style",
            ($mdHeader.attr("style") || "").replace(/top:(.*?)!important/g, "")
          );
          $mdHeader.attr(
            "class",
            ($mdHeader.attr("class") || "").replace("top-0", "")
          );
          $mdHeader.css("top", OcbetreeConstants.GITHUB.TABS_HEIGHT + "px");
        }
      }, 250);
    }

    this._fixMdHeader();
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
      this.cleanCache();
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

    let tabIndex = this.context.cache[path]
      ? this.context.cache[path].index
      : -1;

    if (!(tabIndex >= 0)) {
      tabIndex = Object.keys(this.context.cache).length;
    }

    this.assign({
      cache: Object.assign(this.context.cache, {
        [path]: {
          title: document.title,
          scroll: {
            x: $window.scrollLeft(),
            y: $window.scrollTop(),
          },
          index: tabIndex,
        },
      }),
    });
    this.makingTabs(path);

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
    if (!this._handleScroll) {
      this._handleScroll = _.debounce(() => {
        const path = OcbetreeUtils.getPathWithoutAnchor();
        const index = _.findIndex(this.context.tabs, (v) => v.path === path);

        if (index !== -1) {
          const $window = $(window);
          const x = $window.scrollLeft();
          const y = $window.scrollTop();

          this.context.tabs[index].scroll = {
            x,
            y,
          };
        }
      }, 33);
    }

    this._handleScroll();
    this.fixMdHeader();
  }

  fixFooter() {
    const defaultScroll = this.defaultScroll();

    $("body").css("min-height", `calc(100vh + ${defaultScroll}px)`);
  }

  calcScrollTo(path) {
    path = OcbetreeUtils.getPathWithoutAnchor(path);

    if (!OcbetreeUtils.isBlob(this.context.repository, path)) return 0;

    const defaultScroll = this.defaultScroll();
    const tabIndex = _.findIndex(this.context.tabs, (v) => v.path === path);
    const tab = this.context.tabs[tabIndex];
    const pathScroll = Object.keys(tab).includes("scroll") ? tab.scroll.y : 0;

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
      window.scrollTo(0, this.calcScrollTo(path));
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
