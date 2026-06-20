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

function removePromptAssistantDom(node) {
  if (!node) {
    return;
  }

  const nodeContainer = document.querySelector(`[data-node-id="${node.id}"]`);
  const candidateRoots = new Set();

  if (nodeContainer) {
    candidateRoots.add(nodeContainer);
  }

  for (const widget of node.widgets ?? []) {
    const element = widget?.element ?? widget?.inputEl;
    if (!element) {
      continue;
    }

    delete element._promptAssistantMounted;
    delete element._promptAssistantWidgetKey;

    candidateRoots.add(element.parentElement);
    candidateRoots.add(element.closest?.(".dom-widget"));
    candidateRoots.add(element.closest?.(".p-floatlabel"));
  }

  for (const root of candidateRoots) {
    if (!root) {
      continue;
    }

    root
      .querySelectorAll?.(".assistant-container-common, .prompt-assistant-container")
      .forEach((element) => element.remove());
  }
}

function keepPromptAssistantHidden(node) {
  removePromptAssistantDom(node);
  setTimeout(() => removePromptAssistantDom(node), 0);
  setTimeout(() => removePromptAssistantDom(node), 150);
  setTimeout(() => removePromptAssistantDom(node), 600);
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

      keepPromptAssistantHidden(this);
      return widget;
    };

    const onNodeCreated = nodeType.prototype.onNodeCreated;
    nodeType.prototype.onNodeCreated = function () {
      onNodeCreated?.apply(this, arguments);
      removePromptHelperWidgets(this);
      keepPromptAssistantHidden(this);
      setTimeout(() => {
        removePromptHelperWidgets(this);
        keepPromptAssistantHidden(this);
      }, 300);
    };

    const onConfigure = nodeType.prototype.onConfigure;
    nodeType.prototype.onConfigure = function () {
      onConfigure?.apply(this, arguments);
      removePromptHelperWidgets(this);
      keepPromptAssistantHidden(this);
      setTimeout(() => {
        removePromptHelperWidgets(this);
        keepPromptAssistantHidden(this);
      }, 0);
    };

    const onSelected = nodeType.prototype.onSelected;
    nodeType.prototype.onSelected = function () {
      onSelected?.apply(this, arguments);
      keepPromptAssistantHidden(this);
    };

    const onExecuted = nodeType.prototype.onExecuted;
    nodeType.prototype.onExecuted = function (message) {
      onExecuted?.apply(this, arguments);
      removePromptHelperWidgets(this);
      keepPromptAssistantHidden(this);

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
