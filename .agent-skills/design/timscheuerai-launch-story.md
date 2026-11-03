# Skill Name: Launch Story
> Trigger Command: `/timscheuerai-launch-story`
> Category: DESIGN
> Security Grade: A
> Source: https://www.skillsdirectory.com/skills/timscheuerai-launch-story
> Body: 6029 bytes of verbatim SKILL.md from the source page

# Launch story

> Tool manual under `launch-film`. Start at `skills/launch-film/SKILL.md`: it holds the core, the hook-plus-body template and the lessons. Where this page differs, `launch-film` wins.

Every strong modern launch film is voice-led and continuous: the words say what the product does, the picture shows exactly that, one object turns into the next, and the outcome (a result the viewer wants, shown in real UI) is the climax. The story decides all of that before any pixel moves.

Read `brand/brand.json` first: its `copy` block holds the website's own words (headline, subhead, sections, calls to action, features). The film's message words come from there.

## 1. Brief

Write `film/BRIEF.md` (HyperFrames brief format, so its tooling reads it):

```markdown
---
workflow: product-launch-video
message: "<one sentence the viewer repeats>"
destination: youtube
aspect: 1920x1080
language: en
length: 45s
angle: <spine from the table below>
---

## Intent
What launches, for whom, why now, the tone in the owner's words.

## Assets
Real product screenshots and screen recordings, logos, footage that exists.

## Customizations
Signature moves this film must carry.

## Notes
References, the claims you can prove, things to avoid.
```

Ground the message in the website's copy and the product's real capability. Say what the viewer gets, not what the system is.

## 2. Study a reference (when one is sent)

`bash skills/launch-review/scripts/study_reference.sh <url> film/out/reference 120`, then read the grids, the transcript and the report. Write down: spine, pace (words per second), structure with times, 3 to 5 signature moves, sound design, and what you will do differently. Keep the notes; never commit the reference video.

## 3. Spine

| Spine | Order | Use when |
|---|---|---|
| Watch it run | hook question, the job typed in, the system works (3 visible steps), the outcome lands, positioning line, call to action | a workflow, agent or automation feature; a good default |
| One world tour | a wide establishing shot of the product's world, dive into 3 to 5 parts, pull back to the whole, lockup | platform launches |
| Before and after | the manual mess (overwhelm), one action, everything settles into place, outcome | pain-led launches |
| Receipts | a claim, then proof pieces one per beat (only numbers you can prove), lockup | milestones |

Differentiate inside the spine, not by avoiding it: the spine is grammar, the world and the signatures are the voice.

## 4. Script

- `film/SCRIPT.md` in HyperFrames format: `## Line N: <beat> (Frame N)`, then `**Time:**`, `**Delivery:**`, and the spoken text as a 4-space indented block (only that block is spoken). The same lines go into `film/film.json` `lines`.
- Length: 2.2 to 2.7 words a second. 30 s holds about 70 words, 45 s about 105, 60 s about 140. Cut words before you speed the voice up.
- Hook in outcome language inside the first 3 s, often a question. The message lands by the second beat.
- Every line names something the viewer will see. No line describes an abstraction the picture cannot show.
- Plain, confident register. No hype words, no "revolutionary", no "seamless".
- The positioning line pairs 2 nouns ("X is the interface. Y is the engine." is the shape; write your own, never borrow).
- The brand name is spoken on the cut: the body's first line starts with it.

## 5. Beat sheet on the bar grid

At 120 BPM a bar is 2.0 s and a beat 0.5 s (at 122 BPM: 1.967 s and 0.492 s). Give every beat a bar count and write the act map that `launch-score` turns into sections: intro (hook), build (demo), drop (outcome), breakdown (positioning), outro (logo in near silence). Cuts and key builds land on beats; big reveals on downbeats.

Shape it on the Apple pattern, measured across premium launch films:

- The hero is moving from frame 1: no title card, no static opening hold. The film feels fast because something is already in motion, not because it cuts.
- The body stays calm: 1 idea per beat, room to breathe, the voice sparse.
- The burst (densest cuts, biggest reveal, the drop) sits at 60 to 80 % of the runtime.
- The last visual change lands by about 80 %. The positioning line and the logo then hold for 16 to 28 % of the runtime, well under the body's level or in near silence.
- A 16-bar film (about 32 s): intro bars 1 to 2, build 3 to 9, drop 10 to 13, outro 14 to 16.

In the `film/` template the drop is the cut from the hook to the body, and the beats map onto `film.json` beat types (`name`, `hero`, `product`, `blocks`, `switch`, `end`; see `skills/launch-film/references/body.md`).

## 6. Storyboard

`film/STORYBOARD.md` in HyperFrames format (decision sections above the first frame, `## Frame N: <title>` headings). Per frame, besides the HyperFrames fields (`scene`, `voiceover`, `duration`, `transition_in`, `type`, `blueprint`), always add:

```markdown
- bars: 2
- continuity_in: <what arrives already moving, from where>
- continuity_out: <what is still moving at the cut, where to>
- signature: world-pass | glass-refraction | branch-and-pulse | logo-build | macro-pull-back | none
- sound: <events and palette sounds, see launch-sound>
- words: <the voice-over words that trigger builds>
```

`transition_in` never uses the stock registry transitions (crossfade, blur-crossfade, push-slide, zoom-through, squeeze) as they ship; name a transition from `launch-motion` in your brand's world instead.

## 7. Differentiation test (before approval)

1. **Logo swap:** would this story work unchanged for your closest competitor? If yes, sharpen the product-specific moments.
2. **The world:** where does your brand's world appear (a material, a place, a motif from the site), and does it carry meaning?
3. **The outcome:** is the climax a concrete result the viewer wants (a meeting booked, a report sent, a bug fixed), shown in real UI?

Present the plan as "This film tells <audience> that <message>", then a table `| Frame | Beat | On screen | Why |`. The owner approves the story before production.

## Agent Runtime Output Envelope
```json
{
  "status": "success",
  "skill_executed": "/timscheuerai-launch-story",
  "timestamp": "2026-11-02T17:00:14.909Z"
}
```
