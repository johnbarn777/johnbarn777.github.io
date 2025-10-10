---
title: "LLM for Toxic Comment Classification"
summary: "End-to-end toxic language classifier that benchmarks transformers (DistilBERT, RoBERTa) against classic models to keep online communities safe."
image: "LLM_icon.png"
tech:
  - Python
  - PyTorch
  - Transformers
  - TensorFlow
tags:
  - ML
  - Data
repo: "https://github.com/johnbarn777/ToxicCommentClassification"
demo: "https://github.com/johnbarn777/ToxicCommentClassification"
---
This project assembles a research-grade pipeline for toxic comment detection. It preprocesses the Kaggle toxicity corpus, trains and compares multiple approaches—from logistic regression baselines to fine-tuned DistilBERT, Bi-LSTM, and RoBERTa variants—and records every experiment with artefacts such as ROC curves, word clouds, and prediction exports.

Reusable modules encapsulate tokenization, dataset loaders, model architectures, and evaluation routines so new experiments can be spun up quickly. Comprehensive notebooks and automation scripts make it easy to reproduce the training runs, dig into false positives, and extend the system with new transformer checkpoints or moderation thresholds.
