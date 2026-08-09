# feature — Building Features in unfortunately

## Description

Workflow for building new features in the unfortunately pet simulator. Captures the iterative process: clarify → design → implement → test → iterate → commit.

## When to Use

Invoke this skill when:
- User requests a new feature ("Add petting mechanic", "Add color picker")
- User reports a bug that needs investigation
- User asks to refactor code quality
- You need to extend existing functionality

Do NOT use this skill for:
- Documentation-only tasks (use DECISIONS.md, SPEC.md workflows instead)
- Bug analysis alone (do that inline first)
- Trivial fixes (no workflow needed)

## Workflow Phases

### Phase 1: Clarify Requirements

**Goal:** Ensure you understand exactly what the user wants, with no ambiguity.

**Steps:**
1. Read the user's feature request
2. Identify any ambiguities:
   - How should it look/feel?
   - Where in the UI should it go?
   - What should trigger it?
   - How should it interact with existing features?
3. Ask targeted questions to fill gaps
4. Wait for user answers before proceeding

**Example Questions:**
- "Should this button be in the top-right corner or somewhere else?"
- "When the user does X, should Y happen immediately or after a delay?"
- "Should this work on mobile the same way as desktop?"
- "Should this change persist (save to localStorage) or just for this session?"

**Success Criteria:**
- User confirms understanding
- No edge cases left unresolved
- Implementation path is clear

### Phase 2: Propose & Validate Approach

**Goal:** Agree on implementation strategy before coding.

**Steps:**
1. If the implementation is straightforward → propose approach (don't overthink)
2. If the implementation is uncertain → research (prototype ideas, check existing patterns)
3. Outline your plan:
   - Which components will change?
   - What new state is needed?
   - Which files to modify/create?
   - Any new dependencies or constants?
4. Highlight any tradeoffs or design decisions
5. Wait for user approval or feedback

**When to Research First:**
- User says "I'm not sure about the best approach"
- Implementation approach is non-obvious
- Multiple valid solutions exist (e.g., "should we use Canvas or DOM?")
- You need to test an idea before committing

**When to Skip Research:**
- Implementation path is clear
- Similar features already exist in codebase
- User urgently needs the feature

**Example Approach:**
```
## Proposed Approach

**Files to modify:**
- App.jsx — add color picker state + handler
- MonsterHop.jsx — read color from state
- (New) src/components/ColorPicker.jsx — color picker UI

**State changes:**
- Add useState for currentColor picker visibility
- Add handler to update blob hue + save to localStorage

**Design decision:**
- Settings button in top-right (not bottom-left) for consistency with other settings UIs
- Color picker stays open while game runs (user preferred simplicity)
```

**Success Criteria:**
- User says "yes, do it" or "I like that approach"
- No surprises about implementation during coding

### Phase 3: Implement Feature

**Goal:** Code the feature with quality and correctness.

**Steps:**
1. Create/modify files following code quality standards:
   - Add JSDoc one-liner headers
   - Use clear variable names
   - Extract magic numbers to constants
   - Comments for "why", not "what"
2. Follow existing patterns:
   - State management like other components
   - CSS animations for smooth effects
   - localStorage for persistence
3. Run the code (build should pass)
4. Don't commit yet — wait for testing

**Code Quality Checklist:**
- [ ] Every `.jsx`/`.js` file has JSDoc header
- [ ] No abbreviations in variable names
- [ ] Magic numbers extracted to `src/constants/`
- [ ] Phase/state strings use enums, not magic strings
- [ ] Comments explain "why", not "what"
- [ ] No dead code or commented-out sections
- [ ] No console.log statements left behind
- [ ] No unused imports
- [ ] Follow existing code style/indentation

**Common Patterns in This Codebase:**
- **State initialization**: Use `useState(() => {})` initializer for complex init logic
- **Animations**: Use CSS `@keyframes`, not JS animations
- **Particles**: Use Canvas overlay, not DOM elements
- **Colors**: All derived from hue value via HSL formulas
- **Persistence**: Always use localStorage, save on state change or init
- **Enums**: Phase/state values in `src/constants/`, not magic strings

**Success Criteria:**
- Code follows all patterns above
- Feature compiles without errors
- No existing features broken (yet — will verify in testing)

### Phase 4: Test in Browser (With Screenshots)

**Goal:** Verify the feature works correctly and doesn't break anything by visual inspection.

**Steps:**
1. Start dev server (`npm run dev`)
2. Open app in browser
3. Test golden path (happy case):
   - User performs the intended action
   - Feature behaves as described
   - Visual feedback is clear
4. **Take screenshot** showing the result
5. Analyze the screenshot:
   - Does the visual match the intended behavior?
   - Are there any glitches, misalignments, or unexpected rendering?
   - Do animations look smooth and correct?
6. If screenshot shows an issue → iterate immediately:
   - Diagnose the problem from the screenshot
   - Implement fix
   - Test again and take new screenshot
   - Repeat until screenshot looks correct
7. Test edge cases:
   - What happens if user spams the feature?
   - What happens on mobile/desktop (if applicable)?
   - What happens if localStorage is unavailable?
   - Does it handle small/large screens?
   - Take screenshots of edge cases too
8. Smoke test existing features:
   - Can you still throw the ball?
   - Does monster still eat and grow?
   - Do colors still work?
   - Does persistence still work?
   - Take screenshot showing baseline features still work

**Test Checklist:**
- [ ] Golden path screenshot shows correct behavior
- [ ] No visual glitches in screenshots (rendering, alignment, animation)
- [ ] Performance is acceptable (no lag, 60fps animations)
- [ ] Responsiveness: UI feels snappy in screenshots
- [ ] Edge case screenshots handled gracefully
- [ ] Existing features still work in screenshots
- [ ] localStorage saves/loads correctly (if applicable)
- [ ] Mobile works in screenshots (if applicable)

**Self-Iteration During Testing:**
- Screenshot shows issue → fix it yourself (don't wait for user feedback)
- Screenshot looks good → move on to edge cases
- Only escalate to user if:
  - Screenshot looks correct but behavior feels wrong
  - You can't diagnose the visual issue
  - Visual looks good but design doesn't match spec

**Success Criteria:**
- Screenshots show feature working as intended
- No visual issues in any screenshot
- No regressions visible in existing feature screenshots
- Ready to show user for final approval

### Phase 5: Show User & Iterate on Feedback

**Goal:** Have user review the tested feature and approve it (or request changes).

**Steps:**
1. Show the screenshots from Phase 4 testing
2. Describe what the screenshots show and what works
3. Ask: "Does this match what you wanted?"
4. Wait for feedback
5. If user approves → go to Phase 6 (Commit)
6. If user requests changes → iterate:
   - Implement the change
   - Test in browser (Phase 4 again)
   - Take new screenshot
   - Show updated screenshot to user
   - Repeat until approved

**Important Distinction:**
- You already iterated visually in Phase 4 (based on screenshots)
- Phase 5 is for user feedback on design/behavior, not visual bugs
- Example user feedback: "The color picker should be darker" or "This animation is too slow"

**Possible User Responses:**
- "Yes, perfect" → Commit
- "Almost, but X needs to change" → Implement, test, show new screenshot
- "This looks good but I want to also add Y" → Scope next feature separately, commit current one
- "Not quite, let me describe better..." → Back to Phase 1 (clarify)

**Iteration When User Requests Changes:**
- User: "Button is too small"
  - You: Adjust size in code, take screenshot, show updated button
- User: "Animation feels too fast"
  - You: Adjust timing in code, test, take screenshot, show updated animation
- User: "I like this but want to also add color history"
  - You: "Let's ship color picker first, then add history as next feature"

**Success Criteria:**
- User explicitly approves the implementation (screenshot looks good to them)
- No more requested changes
- Feature ready to commit

### Phase 6: Commit & Push

**Goal:** Save the feature to git with proper authorship and clear commit message.

**Steps:**
1. Stage changed files: `git add [files]`
2. Write clear commit message:
   - Title: concise, verb-first ("Add petting mechanic", "Fix color picker display")
   - Body: explain *why*, not *what*
   - Include context/reasoning that would help future readers
3. Commit with correct authorship:
   ```
   git commit -m "Add petting mechanic
   
   Users can click/long-press blob to pet it, triggering happy
   expression without feeding. Persists to localStorage.
   
   Co-Authored-By: Ruba Sbeih <rsasbeih@gmail.com>"
   ```
4. Push immediately: `git push`
5. Verify GitHub Actions workflow triggers and passes

**Commit Message Format:**
- First line: action + feature (max 70 chars)
- Blank line
- Body: explain the "why" and any non-obvious decisions
- Footer: `Co-Authored-By: Ruba Sbeih <rsasbeih@gmail.com>`

**Success Criteria:**
- Commit is on `main` branch
- GitHub Actions passed
- Code visible on GitHub Pages (within ~2 minutes)

---

## Common Feature Types & Examples

### New Interaction (Like Petting Mechanic)

**Flow:**
1. Clarify: Where does user trigger it? What's the visual feedback?
2. Propose: New component? New state in App.jsx? New animation?
3. Implement: Add event handler, animation, expression
4. Test & Screenshots: Perform action, take screenshot showing animation, verify no broken features
5. Self-iterate: If screenshots show issues (animation wrong, position off, etc.), fix and retest
6. Show user: Present screenshots, ask for approval
7. Iterate on feedback: If user requests changes, implement, screenshot, show again
8. Commit: "Add petting mechanic"

### New Visual Element (Like Color Picker)

**Flow:**
1. Clarify: Where should it appear? When should it open/close? What options?
2. Propose: Modal? Sidebar? Inline? How does it affect game state?
3. Implement: New component, state, handlers, styling
4. Test & Screenshots: Open picker, change color, take screenshots showing color update and game running
5. Self-iterate: Fix visual issues (positioning, sizing, layout) based on screenshots
6. Show user: Present screenshots, ask for approval
7. Iterate on feedback: User says "make picker darker"? Fix, screenshot, show
8. Commit: "Add color picker settings"

### Bug Fix (Like Size Not Persisting)

**Flow:**
1. Clarify: Reproduce the bug, understand the symptom
2. Diagnose: Read code, find root cause
3. Propose: How to fix it? Any side effects?
4. Implement: Minimal fix, no scope creep
5. Test & Screenshots: Verify bug is fixed with screenshot (e.g., reload page, blob stayed same size)
6. Self-iterate: If screenshots show bug still exists, keep investigating and fixing
7. Show user: Present before/after screenshots
8. Commit: "Fix size persistence issue"

### Performance Optimization

**Flow:**
1. Clarify: What's slow? What's the target performance?
2. Propose: Refactor strategy, any tradeoffs?
3. Implement: Code changes with explanation
4. Test & Screenshots: Before/after screenshots showing improvement (smooth animations, no jank)
5. Self-iterate: If screenshots show performance still bad, optimize further
6. Show user: Present screenshots proving improvement
7. Commit: "Optimize particle rendering"

### Code Refactoring (Like Extracting Constants)

**Flow:**
1. Clarify: What's being refactored and why?
2. Propose: Which files change? Any behavior changes?
3. Implement: Extract/reorganize, update imports
4. Test & Screenshots: Everything still works, screenshot showing baseline behavior unchanged
5. Show user: Confirm refactor didn't break anything
6. Commit: "Extract magic numbers to src/constants/"

---

## When Features Go Wrong

### User Disapproves the Approach (Phase 2)

- Don't argue, pivot immediately
- Ask clarifying questions about their preferred approach
- Restart from Phase 2 with new proposal

### Feature Breaks Existing Features (Phase 4)

- Stop, don't commit
- Identify the regression
- Implement minimal fix
- Re-test everything
- Show user and confirm before proceeding

### User Asks for Changes Mid-Feature (Phase 5)

- Don't expand scope infinitely
- If change is small (< 5 min implementation): implement, test, show
- If change is large: commit current feature, start new feature request
- Example: User says "while you're at it, add color history"
  - Response: "Good idea! Let's ship color picker first, then I'll add history as a separate feature"

### You're Uncertain About Implementation

- Ask yourself: "Have I implemented something similar before?"
- If yes: use that pattern
- If no: research (prototype, check docs, ask user if approach is right)
- Don't ship uncertain code

---

## Best Practices

### 1. Minimize Iteration Cycles

- Get requirements right in Phase 1 (ask good questions)
- Propose clearly in Phase 2 (don't surprise user with implementation)
- Reduces Phase 5 (iteration) back-and-forth

### 2. Test Thoroughly in Phase 4

- Catch issues before user has to report them
- Confidence going into Phase 5
- Faster approval → faster commit

### 3. Commit Frequently, Not Large Chunks

- Feature complete → commit (don't wait)
- Each commit is shippable
- Clear git history

### 4. Preserve Existing Behavior

- When adding features, don't "improve" unrelated code
- When fixing bugs, don't refactor surrounding code
- Keep PRs focused

### 5. Document Decisions As You Go

- Add to DECISIONS.md if it's a significant choice
- Use commit messages to explain "why"
- Future you (or AI agents) will thank you

---

## Checklist: Before Marking Feature Complete

- [ ] Phase 1: User's intent fully understood, no ambiguities
- [ ] Phase 2: Implementation approach approved by user
- [ ] Phase 3: Code follows quality standards (headers, naming, constants, comments)
- [ ] Phase 4: Screenshots taken showing golden path, edge cases, no visual issues
- [ ] Phase 4: Self-iterated on any visual issues visible in screenshots
- [ ] Phase 5: User reviewed screenshots and explicitly approved
- [ ] Phase 5: User feedback incorporated (if any), new screenshots show updated version
- [ ] Phase 6: Committed to main with correct authorship, pushed to GitHub
- [ ] GitHub Actions passed
- [ ] Feature visible on GitHub Pages (live)

**Key Principle:** Screenshots are your QA. If screenshots look good, feature is good.

If all boxes checked → feature is done.

---

## When to Diverge From This Workflow

This workflow assumes features are:
- Straightforward to understand
- Not blocked by external factors
- Testable in browser
- Not requiring research/prototyping

**Situations requiring adaptation:**
- **Research-heavy feature** → Extend Phase 2 with more investigation
- **Cross-browser compatibility** → Add browser testing to Phase 4
- **Performance-critical** → Add benchmarking to Phase 4
- **User super-uncertain about design** → Multiple proposals in Phase 2

When in doubt, follow the phases. When you need to skip a phase, that's a flag to ask the user for more clarity first.
