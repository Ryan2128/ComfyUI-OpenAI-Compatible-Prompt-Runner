# ComfyUI-OpenAI-Compatible-Prompt-Runner

A small ComfyUI custom node that sends `system_prompt + input_text` to an OpenAI-compatible Chat Completions API and returns text.

It is intended for text workflow steps such as story expansion, script generation, storyboard generation, and converting structured story materials into image-generation prompts.

## Node

`OpenAI Compatible Prompt Runner`

Inputs:

- `system_prompt`: The instruction that controls the task.
- `input_text`: The user content or previous node output.
- `temperature`: Sampling temperature.
- `max_tokens`: Maximum output token budget.
- `timeout_seconds`: Request timeout.
- `enabled`: When disabled, the node returns the existing `output_text` value from the previous run. If `output_text` is empty, it falls back to `input_text`.
- `output_text`: Read-only display area updated after execution.

Output:

- `text`: The generated result, usable by another text node.

## Config

Copy `config.ini.example` to `config.ini`:

```ini
[API]
api_url = https://api.deepseek.com
api_key = sk-your-api-key
model = deepseek-chat
```

Use any provider that exposes an OpenAI-compatible Chat Completions endpoint.

Examples:

```ini
[API]
api_url = https://api.openai.com/v1
api_key = sk-your-api-key
model = gpt-4o-mini
```

```ini
[API]
api_url = http://127.0.0.1:1234/v1
api_key = lm-studio
model = local-model-name
```

`config.ini` is ignored by git and `.comfyignore` so API keys are not published.

## Install

Clone or copy this folder into `ComfyUI/custom_nodes/`, then install dependencies:

```bash
cd ComfyUI/custom_nodes/ComfyUI-OpenAI-Compatible-Prompt-Runner
pip install -r requirements.txt
```

Restart ComfyUI after installing.

## Five-step workflow

The `prompts/` folder contains five system prompt templates:

- `01_story_expansion_system.txt`
- `02_script_generation_system.txt`
- `03_storyboard_generation_system.txt`
- `04_handdrawn_storyboard_prompt_system.txt`
- `05_storyboard_panel_prompt_splitter_system.txt`

Create five nodes and chain their text outputs:

1. Short idea -> story development material for a 36-72 second short.
2. Story development material -> script structured for 9 shots.
3. Story development material + script -> exactly 9 storyboard shots.
4. Story development material + script + storyboard -> exactly 9-panel, 3x3 storyboard image prompt.
5. Storyboard image prompt -> exactly 9 single-panel prompts, one line per panel.

## Publish to Comfy Registry

Before publishing, edit `pyproject.toml`:

- Replace `YOUR_USERNAME` with your GitHub username.
- Replace `YOUR_PUBLISHER_ID` with your Comfy Registry Publisher ID.
- Keep `project.name` unique and do not include `ComfyUI`.

Then publish:

```bash
comfy node publish
```
