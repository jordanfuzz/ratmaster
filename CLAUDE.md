# Ratmaster - Task Suggester for OSRS Leagues VI

This file guides Claude Code when working with code in this repository.

## Project Overview

Ratmaster is a web app, API, and RuneLite Plugin for Old School RuneScape based around the limited-time game mode "Leagues VI: Demonic Pacts". The plugin will track the user's progress and post updates to the API. The API lives on a self-hosted server, alongside the web app. The web app then displays the user's progress, and uses factors such as region, task completion difficulty, in-game geographical location, and the user's skills and stats to suggest a logical next task.

This project is designed to be used by a small group of friends, and is not currently planned to be made public.

## Tech Stack

- **Plugin**: Java, IntelliJ, Gradle, RuneLite plugin template
- **API**: Node.js, Express, Postgres, no TypeScript
- **Web App**: Vite, React, Tailwind, JS-only, no TypeScript

The API and Web App should run in Docker with a compose.yml both for local development and in production.

The correct Node version to use can be seen in the .nvmrc.

## Resources

- [osrs-reldo/tasks-tracker-plugin](https://github.com/osrs-reldo/tasks-tracker-plugin) - A copy of this repository has been made available locally in the root of this project at ./tasks-tracker-plugin. This is a very similar plugin, and our plugin can largely follow the same pattern. If further details are needed for building the plugin, read this for reference.

## General Notes

Think deeply, ask lots of questions, especially around project features and architecture decisions. Take your time when researching and making decisions.

A .prettierrc.yml file has been provided for code styling.