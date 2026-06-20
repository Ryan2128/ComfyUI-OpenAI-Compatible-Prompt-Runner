import { app } from "../../../scripts/app.js";

app.registerExtension({
  name: "OpenAICompatiblePromptRunner.OutputText",
  beforeRegisterNodeDef(nodeType, nodeData) {
    if (nodeData.name !== "OpenAICompatiblePromptRunner") {
      return;
    }

    const onExecuted = nodeType.prototype.onExecuted;
    nodeType.prototype.onExecuted = function (message) {
      onExecuted?.apply(this, arguments);

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
