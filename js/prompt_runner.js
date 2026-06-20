import { app } from "../../../scripts/app.js";

const PROMPT_HELPER_LABELS = [
  "翻译",
  "标签工具",
  "提示词优化",
];

function isPromptHelperWidget(widgetOrName, value, options) {
  const parts = [
    widgetOrName?.name,
    widgetOrName?.label,
    widgetOrName?.value,
    typeof widgetOrName === "string" ? widgetOrName : "",
    value,
    options?.label,
  ];

  return parts.some((part) => {
    if (part == null) {
      return false;
    }

    const text = String(part);
    return PROMPT_HELPER_LABELS.some((label) => text.includes(label));
  });
}

function removePromptHelperWidgets(node) {
  if (!node?.widgets?.length) {
    return;
  }

  const before = node.widgets.length;
  node.widgets = node.widgets.filter((widget) => !isPromptHelperWidget(widget));

  if (node.widgets.length !== before) {
    node.setSize?.(node.computeSize?.() ?? node.size);
    app.graph.setDirtyCanvas(true, true);
  }
}

app.registerExtension({
  name: "OpenAICompatiblePromptRunner.OutputText",
  beforeRegisterNodeDef(nodeType, nodeData) {
    if (nodeData.name !== "OpenAICompatiblePromptRunner") {
      return;
    }

    const addWidget = nodeType.prototype.addWidget;
    nodeType.prototype.addWidget = function (type, name, value, callback, options) {
      const widget = addWidget?.apply(this, arguments);

      if (isPromptHelperWidget(name, value, options)) {
        removePromptHelperWidgets(this);
      }

      return widget;
    };

    const onNodeCreated = nodeType.prototype.onNodeCreated;
    nodeType.prototype.onNodeCreated = function () {
      onNodeCreated?.apply(this, arguments);
      removePromptHelperWidgets(this);
      setTimeout(() => removePromptHelperWidgets(this), 0);
      setTimeout(() => removePromptHelperWidgets(this), 300);
    };

    const onConfigure = nodeType.prototype.onConfigure;
    nodeType.prototype.onConfigure = function () {
      onConfigure?.apply(this, arguments);
      removePromptHelperWidgets(this);
      setTimeout(() => removePromptHelperWidgets(this), 0);
    };

    const onExecuted = nodeType.prototype.onExecuted;
    nodeType.prototype.onExecuted = function (message) {
      onExecuted?.apply(this, arguments);
      removePromptHelperWidgets(this);

      if (!message?.output_text) {
        return;
      }

      const widget = this.widgets?.find((item) => item.name === "output_text");
      if (widget) {
        widget.value = message.output_text.join("");
      }
    };
  },
});
