# Problem Statement

## Background

AI agents are increasingly capable of interacting with tools, APIs, databases,
and external systems. As a result, evaluating only an agent's text response is
not sufficient to determine whether the agent behaved securely.

A security failure may occur when an AI agent:

- Executes a protected tool without satisfying required conditions.
- Allows user instructions to bypass security workflows.
- Trusts unverified authority claims.
- Follows malicious instructions from retrieved content.
- Gradually deviates from security rules across multiple conversation turns.
- Reveals protected or confidential information.

Traditional AI red-teaming approaches often rely on generic jailbreak prompts or
large attack libraries. These approaches do not automatically understand the
application-specific security rules of a particular AI agent.

For example, a customer-support agent may be allowed to search for an order, but
must never issue a refund unless the order has been successfully verified.
A generic jailbreak dataset does not inherently understand that this specific
tool workflow is a critical security requirement.

## Problem

There is a need for a system that can understand the security rules of a
specific AI agent and use those rules to generate and evaluate targeted attacks.

The system should not only analyze what the agent says. It should also analyze
what actions the agent performs through tools and whether those actions satisfy
the required security conditions.

## Proposed Solution

AI Agent Guardian is a security testing system for AI agents.

The system will:

1. Understand an AI agent's configuration, tools, and security policies.
2. Convert high-level security policies into structured constraints.
3. Identify protected actions and relevant security conditions.
4. Generate targeted attacks designed to violate those constraints.
5. Execute the attacks against the target AI agent.
6. Analyze the agent response, execution trace, tool calls, and security state.
7. Classify the outcome using deterministic checks and semantic evaluation.
8. Store successful attacks for future regression testing.

## Core Security Loop

The project is built around the following loop:

Understand
→ Attack
→ Judge
→ Fix
→ Regression

## MVP Target

The primary MVP target is ShopAssist, a controlled e-commerce customer-support
AI agent operating on mock data and mock tools.

The main demonstration will focus on a refund workflow bypass in which an attack
attempts to cause ShopAssist to execute a refund without successful order
verification.

The system must demonstrate the full security lifecycle:

Attack succeeds
→ Violation is detected
→ The vulnerability is fixed
→ The same attack is blocked
→ The attack is retained for regression testing

## Goal

The goal of AI Agent Guardian is not to build a generic jailbreak detector.

The goal is to demonstrate application-aware AI agent security testing by
connecting:

Security Policies
→ Constraints
→ Threat Modeling
→ Targeted Attacks
→ Execution Evidence
→ Security Findings
→ Regression Testing
