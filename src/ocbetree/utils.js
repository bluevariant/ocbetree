class OcbetreeUtils {}

OcbetreeUtils.getCurrentPath = function () {
  // Convert /username/reponame/object_type/branch/path to path
  const path = decodeURIComponent(location.pathname);
  const match = path.match(/(?:[^\/]+\/){4}(.*)/);
  if (!match) return;

  return match[1];
};

OcbetreeUtils.getPathWithoutAnchor = function (path) {
  return (path || location.pathname).replace(/#.*$/, "");
};

OcbetreeUtils.isBlob = function (repo, path) {
  if (!repo) return false;

  return path.startsWith(`/${repo.username}/${repo.reponame}/blob/`);
};

OcbetreeUtils.isTree = function (repo, path) {
  if (!repo) return false;

  return path.startsWith(`/${repo.username}/${repo.reponame}/tree/`);
};

OcbetreeUtils.isHome = function (repo, path) {
  if (!repo) return false;

  return path.endsWith(`/${repo.username}/${repo.reponame}`);
};

OcbetreeUtils.removeAllAttrs = function (element) {
  try {
    const $element = $(element);
    const attrs = _.map($element[0].attributes, (v) => v.name);

    $element.removeAttr(attrs.join(" "));
  } catch (e) {
    console.error(e);
  }
};

OcbetreeUtils.cloneElement = function (element) {
  try {
    const $element = $(element);
    const shadow = document.createElement($element.prop("tagName"));

    _.forEach($element[0].attributes, (v) => {
      shadow.setAttribute(v.name, v.value);
    });

    return shadow;
  } catch (e) {
    console.error(e);
  }
};

OcbetreeUtils.selectPath = function selectPath($jstree, paths, index = 0) {
  if (!$jstree || !$jstree.get_node) return;

  const nodeId = NODE_PREFIX + paths[index];

  if ($jstree.get_node(nodeId)) {
    $jstree.deselect_all();
    $jstree.select_node(nodeId);
    $jstree.open_node(nodeId, () => {
      if (++index < paths.length) {
        selectPath(paths, index);
      }
    });
  } else if (paths.length === 1) {
    $jstree.deselect_all();
  }
};
