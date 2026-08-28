# Attack Taxonomy

An attack family describes the **style of manipulation** used by an attacker to try to bypass a security policy. It describes *how the attack works*, while the evaluation label describes *what happened as a result*.

## Attack Families

### 1. Authority Impersonation

The attacker pretends to be someone with higher authority, such as a manager or administrator, to convince the AI to bypass a required security control.

### 2. Tool Workflow Bypass

The attacker attempts to make the AI skip, reorder, or ignore a required step in a tool workflow, such as verification before issuing a refund.

### 3. Multi-Turn Manipulation

The attacker gradually builds trust or establishes a misleading context across multiple messages before using that trust to attempt a policy bypass.

### 4. Indirect Prompt Injection

The attacker hides malicious instructions inside content that the AI is processing, rather than giving the instructions directly in the chat.

### 5. Conflicting Instructions

The attacker provides contradictory instructions or rules in an attempt to make the AI prioritize the wrong instruction and violate a security requirement.

### 6. Data Access Boundary

The attacker attempts to make the AI access or reveal information belonging to another customer or outside the user's authorized data boundary.

## Scope

The primary attack families for the MVP are:

* Authority impersonation
* Tool workflow bypass
* Multi-turn manipulation
* Indirect prompt injection

Conflicting instructions and data access boundary are optional stretch families if time allows.
