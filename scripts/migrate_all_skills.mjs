import fs from 'fs';
import path from 'path';

const workspaceRoot = process.cwd();
const agentsSkillsDir = path.join(workspaceRoot, '.agents', 'skills');
const projectClaudeSkillsDir = path.join(workspaceRoot, '.claude', 'skills');
const claudeSkillsSourceDir = 'C:\\Users\\HP\\.claude\\skills';
const geminiConfigSkillsDir = 'C:\\Users\\HP\\.gemini\\config\\skills';

fs.mkdirSync(agentsSkillsDir, { recursive: true });
fs.mkdirSync(projectClaudeSkillsDir, { recursive: true });
fs.mkdirSync(geminiConfigSkillsDir, { recursive: true });

function cleanDesc(raw) {
  let s = raw.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');
  s = s.replace(/[`*#_]/g, '');
  s = s.replace(/"/g, "'");
  s = s.replace(/\s+/g, ' ').trim();
  if (s.length > 300) {
    const idx = s.indexOf('.', 200);
    if (idx !== -1 && idx < 350) {
      s = s.slice(0, idx + 1);
    } else {
      s = s.slice(0, 280) + '...';
    }
  }
  return s;
}

// 1. Process 100 skills from .agent-skills
console.log('=== Processing .agent-skills ===');
const manifestPath = path.join(workspaceRoot, '.agent-skills', '.manifest.jsonl');
const manifestLines = fs.readFileSync(manifestPath, 'utf8').trim().split('\n');

let agentSkillsCount = 0;
for (const line of manifestLines) {
  const item = JSON.parse(line);
  if (!item.ok) continue;

  const srcPath = path.join(workspaceRoot, '.agent-skills', item.f, item.s + '.md');
  if (!fs.existsSync(srcPath)) continue;

  const rawContent = fs.readFileSync(srcPath, 'utf8');
  const flines = rawContent.split('\n');

  let desc = '';
  for (let i = 0; i < flines.length; i++) {
    const l = flines[i].trim();
    if (i < 8 && (l.startsWith('#') || l.startsWith('>') || l.startsWith('<!--'))) continue;
    if (l.startsWith('#') || l.startsWith('<!--') || l.startsWith('|') || l.startsWith('**Plugin')) continue;
    if (l.length > 25) {
      desc = cleanDesc(l);
      break;
    }
  }
  if (!desc) {
    desc = `Expert workflow and procedural guide for ${item.n} (${item.f}).`;
  }

  const skillContent = `---
name: ${item.s}
description: >-
  ${desc}
---

${rawContent.trim()}
`;

  // Write to .agents/skills/<slug>/SKILL.md
  const targetDir = path.join(agentsSkillsDir, item.s);
  fs.mkdirSync(targetDir, { recursive: true });
  fs.writeFileSync(path.join(targetDir, 'SKILL.md'), skillContent, 'utf8');

  // Also mirror to .claude/skills/<slug>/SKILL.md
  const claudeTargetDir = path.join(projectClaudeSkillsDir, item.s);
  fs.mkdirSync(claudeTargetDir, { recursive: true });
  fs.writeFileSync(path.join(claudeTargetDir, 'SKILL.md'), skillContent, 'utf8');

  agentSkillsCount++;
}
console.log(`Successfully migrated ${agentSkillsCount} skills from .agent-skills to .agents/skills/ and .claude/skills/`);

// 2. Process Claude skills from C:\Users\HP\.claude\skills
console.log('=== Processing C:\\Users\\HP\\.claude\\skills ===');
const claudeItems = fs.readdirSync(claudeSkillsSourceDir);
let claudeMigratedCount = 0;

for (const name of claudeItems) {
  const srcSkillDir = path.join(claudeSkillsSourceDir, name);
  const skillMdPath = path.join(srcSkillDir, 'SKILL.md');
  if (!fs.existsSync(skillMdPath)) continue;

  // Target in workspace .agents/skills/<name>
  const targetDir = path.join(agentsSkillsDir, name);
  if (!fs.existsSync(targetDir)) {
    fs.cpSync(srcSkillDir, targetDir, { recursive: true });
  }

  // Target in project .claude/skills/<name>
  const projectClaudeDir = path.join(projectClaudeSkillsDir, name);
  if (!fs.existsSync(projectClaudeDir)) {
    fs.cpSync(srcSkillDir, projectClaudeDir, { recursive: true });
  }

  // Target in global ~/.gemini/config/skills/<name>
  const globalTargetDir = path.join(geminiConfigSkillsDir, name);
  if (!fs.existsSync(globalTargetDir)) {
    fs.cpSync(srcSkillDir, globalTargetDir, { recursive: true });
  }

  claudeMigratedCount++;
}
console.log(`Successfully imported and registered ${claudeMigratedCount} Claude skills!`);

// 3. Create claude-design skill
console.log('=== Creating claude-design skill ===');
const claudeDesignSkillContent = `---
name: claude-design
description: >-
  Interactive design laboratory guide for YemEmUnnai. Use to preview, evaluate, compare, and integrate the 15 UI variants, fixtures, and design-brief specifications from .claude-design into production components.
---

# Claude Design Lab for YemEmUnnai

This skill provides direct workflows and instructions for exploring, benchmarking, and taking into use the design deliverables located in the \`.claude-design/\` folder.

## Lab Assets & Structure

- **Design Brief**: \`.claude-design/design-brief.json\`
  - Primary Brand Color: \`#F06A05\` (Warm energetic orange)
  - Typography: Plus Jakarta Sans
  - Design Inspirations: Swiggy, Zomato, Toing
  - Key Objectives: Visual polish, premium motion, clear hierarchy, optimistic UI updates, WCAG 2.2 AA accessibility.
- **Fixtures & Mock Data**: \`.claude-design/lab/data/fixtures.ts\`
  - Realistically formatted Vendors (\`MOCK_VENDORS\`), Categories (\`MOCK_CATEGORIES\`), Food Items (\`MOCK_FOOD_ITEMS\`).
- **Screen Variants**: \`.claude-design/lab/variants/\` (5 distinct archetypes per core screen):
  - **Variant A (Information Hierarchy)**: Clean visual levels, prominent photos, sticky actions, progressive disclosure.
  - **Variant B (Layout Model)**: List-based / split-pane cards, horizontal scrolling sections, persistent sidebars.
  - **Variant C (Density Focus)**: Compact spacing, high information density, rapid scanning for quick decisions.
  - **Variant D (Interaction Model)**: Bottom sheet drawers, progressive step-by-step disclosure, touch gestures.
  - **Variant E (Expressive Direction)**: Premium brand polish, layered elevation shadows, micro-interactions, delightful motion.

## Available Variant Components

### 1. Home Discovery Feed
- \`HomeDiscoveryVariantA.tsx\`: Clear visual hierarchy with hero gradient, sticky search, categorized vendor pills.
- \`HomeDiscoveryVariantB.tsx\`: Horizontal vendor scroll + expandable category lists.
- \`HomeDiscoveryVariantC.tsx\`: High-density compact cards for high-speed scanning.
- \`HomeDiscoveryVariantD.tsx\`: Swiggy/Toing bottom-sheet drawer with quick-add actions.
- \`HomeDiscoveryVariantE.tsx\`: Rich micro-interactions, floating filters, and motion-enhanced cards.

### 2. Food Item Detail
- \`FoodItemDetailVariantA.tsx\`: Prominent hero photo, sticky bottom action bar, dietary indicators.
- \`FoodItemDetailVariantB.tsx\`: Split-pane layout with sticky photo sidebar and tabbed details.
- \`FoodItemDetailVariantC.tsx\`: Compact specification view with nutrition, allergens, and quick-order triggers.
- \`FoodItemDetailVariantD.tsx\`: Interactive bottom sheet with customizable addons and swipe-to-dismiss.
- \`FoodItemDetailVariantE.tsx\`: Expressive presentation with animated addon selection and portion toggles.

### 3. Quick Order Modal
- \`QuickOrderModalVariantA.tsx\`: Structured bottom-sheet order summary with inline quantity steppers.
- \`QuickOrderModalVariantB.tsx\`: Segmented card layout with horizontal option trays.
- \`QuickOrderModalVariantC.tsx\`: Streamlined single-glance review modal for 1-tap checkout.
- \`QuickOrderModalVariantD.tsx\`: Stepper wizard (Customize -> Addons -> Review -> Confirm).
- \`QuickOrderModalVariantE.tsx\`: Animated micro-feedback on item modification, live price calculation ticker.

## How to Take Them Into Use

1. **Compare Variants**: Review the variants in \`.claude-design/lab/variants/\` against target requirements.
2. **Preview**: Import any variant directly into test views or swap into \`src/components/HomeDiscoveryScreen.tsx\`, \`FoodItemDetailScreen.tsx\`, or \`QuickOrderModal.tsx\`.
3. **Harmonize**: Ensure tokens align with \`src/index.css\` and existing Lucide React iconography.
4. **Deploy**: Replace or merge winning variant patterns into \`src/components/\`.
`;

const claudeDesignTargetAgents = path.join(agentsSkillsDir, 'claude-design');
fs.mkdirSync(claudeDesignTargetAgents, { recursive: true });
fs.writeFileSync(path.join(claudeDesignTargetAgents, 'SKILL.md'), claudeDesignSkillContent, 'utf8');

const claudeDesignTargetGlobal = path.join(geminiConfigSkillsDir, 'claude-design');
fs.mkdirSync(claudeDesignTargetGlobal, { recursive: true });
fs.writeFileSync(path.join(claudeDesignTargetGlobal, 'SKILL.md'), claudeDesignSkillContent, 'utf8');

const claudeDesignTargetClaude = path.join(projectClaudeSkillsDir, 'claude-design');
fs.mkdirSync(claudeDesignTargetClaude, { recursive: true });
fs.writeFileSync(path.join(claudeDesignTargetClaude, 'SKILL.md'), claudeDesignSkillContent, 'utf8');

console.log('claude-design skill created in .agents/skills, ~/.gemini/config/skills, and .claude/skills!');
