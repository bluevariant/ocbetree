class OcbetreeUtils {}

OcbetreeUtils.getPathWithoutAnchor = function (path) {
  return (path || location.pathname).replace(/#.*$/, "");
};
