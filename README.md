# gityo

`gityo` is a CLI that helps you stage changes, write or generate a commit message, commit, and optionally push or open a pull request.

It is built for people who want a faster commit flow without turning git into a wall of commands.

## Install

```bash
npm install -g gityo
```

Or run it without installing globally:

```bash
npx gityo
```

## What it does

- lets you choose which changed files to stage
- lets you write your own commit message
- can generate a commit message with AI
- can inspect files, staged diffs, GitHub issues, and docs while generating
- creates the commit for you
- can run a post-commit action like `git push` or `gh pr create`

## Quick use

Run it inside a git repository:

```bash
gityo
```

Typical flow:

1. Pick files to stage
2. Type a commit message or generate one
3. Create the commit
4. Optionally run the configured post-commit action

## Common commands

```bash
gityo
gityo --stage
gityo --generate
gityo --message "fix login redirect bug"
gityo --pr main
gityo --yolo
```

## AI setup

If you want AI-generated commit messages, set a model once and reuse it:

```bash
gityo config set model openai gpt-4.1 YOUR_API_KEY
```

Then use:

```bash
gityo --generate
```

Supported providers include OpenAI, Anthropic, Google, OpenRouter, and compatible custom endpoints.

When the staged diff is too large to send directly, gityo sends a compact diff summary first and lets the model inspect specific files, staged diffs, GitHub issues, and linked documentation with tools.

## Config

View your current config:

```bash
gityo config
```

You can also write config manually.

Project config goes in:

```text
.gityo.config.json
```

Global config goes in:

```text
~/.config/gityo.json
```

You can also add repo-specific writing instructions in:

```text
.gityo.md
```

That file is useful when you want commit messages in a certain tone or format for one project.

If you want editor autocomplete and validation, use this schema:

```text
https://github.com/NazmusSayad/gityo/raw/refs/heads/schema/schema.json
```

Example:

```json
{
  "$schema": "https://github.com/NazmusSayad/gityo/raw/refs/heads/schema/schema.json",
  "model": {
    "provider": "openai",
    "name": "gpt-4.1"
  },
  "autoAcceptMessage": false,
  "postCommand": "push",
  "pullRequestBaseBranch": "main",
  "autoRunPostCommand": false,
  "instructions": "Write short, clear commit messages."
}
```

Example instructions file:

```md
Use imperative commit messages.
Mention the user-facing change first.
Keep the subject line under 72 characters.
```

Priority is simple:

- `.gityo.md` for repo-specific instructions
- `.gityo.config.json` for project config
- `~/.config/gityo.json` for your defaults

A few useful examples:

```bash
gityo config set postCommand push
gityo config set postCommand push-and-pr
gityo config set pullRequestBaseBranch main
gityo config set autoRunPostCommand true
gityo config set autoAcceptCommitMessage true
```

To create a pull request right after commit without changing config:

```bash
gityo --pr main
```

## Good for

- quick everyday commits
- cleaner staging and commit flow
- AI-assisted commit messages without losing control

## Notes

- run it inside a git repo
- if there are no changed files, it exits early
- `--yolo` is the fastest mode and skips the usual prompts
