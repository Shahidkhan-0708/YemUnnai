# Animation Implementation Plans

This directory contains standalone, self-contained animation implementation plans produced by the `improve-animations` advisor.

## Plans Index

| Plan | Title | Severity | Category | Status | Dependencies |
|---|---|---|---|---|---|
| [001](001-morphing-add-to-stepper.md) | Morphing ADD to Stepper State Transition | HIGH | State indication & Preventing a jarring change | DONE | None |

## Recommended Execution Order

1. **`001-morphing-add-to-stepper.md`**: Addresses the primary tactile micro-interaction in the consumer food discovery surfaces (`ItemCardPremium` and `ShopMenuItem`). No dependencies.

## Execution

To execute this plan with an autonomous executor subagent, run:
```bash
/improve-animations execute plans/001-morphing-add-to-stepper.md
```
Or hand the plan file directly to any coding agent.
