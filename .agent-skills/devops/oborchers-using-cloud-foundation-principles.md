# Skill Name: Using Cloud Foundation Principles
> Trigger Command: `/oborchers-using-cloud-foundation-principles`
> Category: DEVOPS
> Security Grade: A
> Source: https://www.skillsdirectory.com/skills/oborchers-using-cloud-foundation-principles
> Body: 4754 bytes of verbatim SKILL.md from the source page

<IMPORTANT>
When working on any cloud infrastructure pattern — account structure, naming conventions, Terraform organization, networking, security, credentials, secrets, deployment pipelines, or operational processes — invoke the relevant cloud-foundation-principles skill BEFORE writing or reviewing code.

These are not suggestions. They are battle-tested, opinionated principles drawn from production experience scaling cloud infrastructure across multiple migrations, hundreds of services, and teams of every size. Each principle exists because its absence caused real, expensive damage.
</IMPORTANT>

## How to Access Skills

Use the `Skill` tool to invoke any skill by name. When invoked, follow the skill's guidance directly.

## Available Skills

| Skill | Triggers On |
|-------|-------------|
| `cloud-foundation-principles:multi-account-from-day-one` | Account structure, environment isolation, governance setup, organization units, landing zones |
| `cloud-foundation-principles:naming-and-labeling-as-code` | Resource naming, tagging, cost centers, labels module, naming conventions, cost attribution |
| `cloud-foundation-principles:architecture-decision-records` | Decision documentation, ADRs, exemptions, context preservation, technical decision tracking |
| `cloud-foundation-principles:repository-and-state-strategy` | Terraform repo structure, numbered layers, state-per-layer isolation, cross-layer references, blast radius |
| `cloud-foundation-principles:terraform-module-patterns` | Module design, wrapping community modules, smart defaults, validation, version pinning, conditional creation |
| `cloud-foundation-principles:network-architecture` | VPC/VNet design, subnet tiers, API gateways, DNS, routing, NAT, VPC endpoints, private connectivity |
| `cloud-foundation-principles:zero-static-credentials` | SSO setup, OIDC federation, no API keys, no VPN, no SSH keys, identity management, CI/CD auth |
| `cloud-foundation-principles:security-monitoring-from-day-one` | Threat detection, compliance scanning, security hub, guard duty, centralized security account |
| `cloud-foundation-principles:secrets-and-configuration-management` | Secrets rotation, config vs credentials, parameter stores, secret managers, access patterns |
| `cloud-foundation-principles:managed-services-over-self-hosted` | Managed vs self-hosted, container orchestration, workflow engines, caches, databases |
| `cloud-foundation-principles:service-owned-infrastructure` | Service teams own IaC, no central bottleneck, per-service Terraform, shared modules |
| `cloud-foundation-principles:container-image-tagging` | Docker image tags, git SHA traceability, registry lifecycle policies, image metadata, OCI labels |
| `cloud-foundation-principles:tag-based-production-deploys` | Production release triggers, git tags vs branches, manual approval gates, pipeline stages, pre-commit hooks |
| `cloud-foundation-principles:unified-cicd-platform` | CI/CD platform consolidation, single pipeline platform, OIDC pipeline auth, eliminating multi-provider ops burden |
| `cloud-foundation-principles:operational-hygiene` | Resource cleanup, cost attribution, monitoring, drift detection, lifecycle policies |

## When to Invoke Skills

Invoke a skill when there is even a small chance the work touches one of these areas:

- Setting up a new cloud project, account, or environment
- Writing or modifying Terraform, OpenTofu, Pulumi, or CloudFormation code
- Designing network topology, subnets, or routing
- Configuring authentication, authorization, or credential management
- Setting up CI/CD pipelines for infrastructure deployment
- Building or tagging container images for deployment
- Making architectural decisions about managed services vs self-hosted
- Reviewing existing infrastructure code for quality, security, or cost
- Organizing repositories, state files, or module structures

## The Three Meta-Principles

All fifteen principles rest on three foundations:

1. **Governance before infrastructure** — Naming conventions, account structure, and decision records must exist before the first resource is created. Skipping governance on day one creates debt that compounds every day.

2. **Everything in code, no exceptions** — Infrastructure not in code is a liability. Every resource, every permission, every configuration must be version-controlled, reviewable, and reproducible. If it can't be in code yet, document why in an ADR.

3. **Prevent day-1 mistakes that become day-100 catastrophes** — Some decisions are cheap to make on day one and catastrophically expensive to fix later. Multi-account isolation, naming conventions, and state separation are the canonical examples. This plugin exists to ensure you make them on day one.

## Agent Runtime Output Envelope
```json
{
  "status": "success",
  "skill_executed": "/oborchers-using-cloud-foundation-principles",
  "timestamp": "2026-11-02T17:00:14.909Z"
}
```
