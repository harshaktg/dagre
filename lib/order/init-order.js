"use strict";

var _ = require("../lodash");

module.exports = initOrder;

/*
 * Assigns an initial order value for each node by performing a DFS search
 * starting from nodes in the first rank. Nodes are assigned an order in their
 * rank as they are first visited.
 *
 * This approach comes from Gansner, et al., "A Technique for Drawing Directed
 * Graphs."
 *
 * Returns a layering matrix with an array per layer and each layer sorted by
 * the order of its nodes.
 */
function initOrder(g) {
  var visited = {},
    simpleNodes = _.filter(g.nodes(), function (v) {
      return !g.children(v).length;
    }),
    maxRank = _.max(
      _.map(simpleNodes, function (v) {
        return g.node(v).rank;
      })
    ),
    layers = _.map(_.range(maxRank + 1), function () {
      return [];
    });

  function dfs(v) {
    if (_.has(visited, v)) return;
    visited[v] = true;
    var node = g.node(v);
    layers[node.rank].push(v);
    _.each(g.successors(v), dfs);
  }

  var orderedVs = _.sortBy(simpleNodes, function (v) {
    return g.node(v).rank;
  });
  _.each(orderedVs, dfs);

  // HV: preserve order node orders and corresponding edge
  const midLayerCount = Math.floor(layers.length / 2);
  if (!midLayerCount) return layers;
  const nodeSortedLayers = layers.map((layer, index) => {
    if (index % 2 === 0) {
      return _.sortBy(layer, (item) => g.node(item).order);
    }
    return layer;
  });
  const updatedLayers = nodeSortedLayers.map((layer, index) => {
    if (index % 2 !== 0) {
      const sortedProcesses = [];
      if (index > midLayerCount) {
        nodeSortedLayers[index + 1].forEach((nodeId) =>
          sortedProcesses.push(
            ...layer.filter(
              (processId) => g.node(processId).edgeObj.w === nodeId
            )
          )
        );
      } else {
        nodeSortedLayers[index - 1].forEach((nodeId) =>
          sortedProcesses.push(
            ...layer.filter(
              (processId) => g.node(processId).edgeObj.v === nodeId
            )
          )
        );
      }
      const otherProcesses = layer.filter(
        (processId) => !sortedProcesses.includes(processId)
      );
      return [...sortedProcesses, ...otherProcesses];
    }
    return layer;
  });
  // return layers;
  return updatedLayers;
}
