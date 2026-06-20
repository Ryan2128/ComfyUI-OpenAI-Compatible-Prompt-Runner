import configparser
from pathlib import Path

from openai import OpenAI


CONFIG_PATH = Path(__file__).resolve().parent / "config.ini"


def _read_config():
    config = configparser.ConfigParser()
    config.read(CONFIG_PATH, encoding="utf-8")
    section = config["API"] if config.has_section("API") else {}

    return {
        "api_url": section.get("api_url", "https://api.openai.com/v1").strip(),
        "api_key": section.get("api_key", "").strip(),
        "model": section.get("model", "gpt-4o-mini").strip(),
    }


class OpenAICompatiblePromptRunner:
    @classmethod
    def INPUT_TYPES(cls):
        return {
            "required": {
                "system_prompt": (
                    "STRING",
                    {
                        "multiline": True,
                        "default": "You are a helpful assistant.",
                        "dynamicPrompts": False,
                        "placeholder": "System prompt",
                    },
                ),
                "input_text": (
                    "STRING",
                    {
                        "multiline": True,
                        "default": "",
                        "dynamicPrompts": False,
                        "placeholder": "Input text",
                    },
                ),
                "temperature": (
                    "FLOAT",
                    {
                        "default": 0.7,
                        "min": 0.0,
                        "max": 2.0,
                        "step": 0.05,
                    },
                ),
                "max_tokens": (
                    "INT",
                    {
                        "default": 4096,
                        "min": 1,
                        "max": 32768,
                        "step": 1,
                    },
                ),
                "timeout_seconds": (
                    "INT",
                    {
                        "default": 120,
                        "min": 10,
                        "max": 600,
                        "step": 1,
                    },
                ),
                "enabled": ("BOOLEAN", {"default": True}),
                "output_text": (
                    "STRING",
                    {
                        "multiline": True,
                        "default": "",
                        "dynamicPrompts": False,
                        "placeholder": "Generated output",
                    },
                ),
            }
        }

    RETURN_TYPES = ("STRING",)
    RETURN_NAMES = ("text",)
    FUNCTION = "run"
    CATEGORY = "OpenAI Compatible/Text"

    def run(
        self,
        system_prompt,
        input_text,
        temperature,
        max_tokens,
        timeout_seconds,
        enabled,
        output_text="",
    ):
        if not enabled:
            return {"ui": {"output_text": [input_text]}, "result": (input_text,)}

        settings = _read_config()
        api_url = settings["api_url"]
        api_key = settings["api_key"]
        model = settings["model"]

        if not api_key:
            raise RuntimeError(
                f"Missing api_key. Create {CONFIG_PATH.name} next to nodes.py and set [API] api_key."
            )
        if not api_url:
            raise RuntimeError("Missing api_url in config.ini [API].")
        if not model:
            raise RuntimeError("Missing model in config.ini [API].")

        try:
            client = OpenAI(
                api_key=api_key,
                base_url=api_url,
                timeout=timeout_seconds,
            )
            response = client.chat.completions.create(
                model=model,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": input_text},
                ],
                temperature=temperature,
                max_tokens=max_tokens,
            )
        except Exception as exc:
            raise RuntimeError(f"OpenAI-compatible request failed: {exc}") from exc

        text = response.choices[0].message.content or ""
        return {"ui": {"output_text": [text]}, "result": (text,)}


NODE_CLASS_MAPPINGS = {
    "OpenAICompatiblePromptRunner": OpenAICompatiblePromptRunner,
}

NODE_DISPLAY_NAME_MAPPINGS = {
    "OpenAICompatiblePromptRunner": "OpenAI Compatible Prompt Runner",
}
