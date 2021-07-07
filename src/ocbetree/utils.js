class OcbetreeUtils {}

OcbetreeUtils.getPathWithoutAnchor = function (path) {
  return (path || location.pathname).replace(/#.*$/, "");
};

OcbetreeUtils.isBlob = function (repo, path) {
  return path.startsWith(`/${repo.username}/${repo.reponame}/blob/`);
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
