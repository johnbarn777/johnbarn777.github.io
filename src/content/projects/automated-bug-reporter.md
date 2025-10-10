---
title: "Automated Bug Reporter for FC25"
summary: "Vision and NLP agents that capture gameplay anomalies, assemble evidence, and draft bug reports ready for triage."
image: "icons/bug-reporter.svg"
tech:
  - Python
  - FastAPI
  - OpenCV
  - Poetry
tags:
  - ML
  - Tools
repo: "https://github.com/johnbarn777/NLP_VIsion_Auto_Bug_Reporter"
---
This project stitches together a capture agent, detector service, NLP summarizer, and exporter to help QA teams log FC25 issues in minutes instead of hours. The pipeline records gameplay clips, flags anomalies like freezes or HUD glitches, and feeds structured context into an LLM that produces Markdown and JSON drafts with severity, repro steps, and attachments.

The codebase is production-minded: FastAPI services, modular detectors, docker-compose orchestration, and a web dashboard for triage. Synthetic data generators and pytest suites validate the system end-to-end, while connectors make it easy to ship reports to CSV, Jira, or GitHub issues.
