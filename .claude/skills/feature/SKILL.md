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

### Phase 4: Test in Browser

**Goal:** Verify the feature works correctly and doesn't break anything.

**Steps:**
1. Start dev server (`npm run dev`)
2. Open app in browser
3. Test golden path (happy case):
   - User performs the intended action
   - Feature behaves as described
   - Visual feedback is clear
4. Test edge cases:
   - What happens if user spams the feature?
   - What happens on mobile/desktop (if applicable)?
   - What happens if localStorage is unavailable?
   - Does it handle small/large screens?
5. Smoke test existing features:
   - Can you still throw the ball?
   - Does monster still eat and grow?
   - Do colors still work?
   - Does persistence still work?
6. Take screenshot or describe result

**Test Checklist:**
- [ ] Golden path works as described
- [ ] No visual glitches (rendering, animation)
- [ ] Performance is acceptable (no lag, 60fps animations)
- [ ] Responsiveness: UI feels snappy
- [ ] Edge cases handled gracefully
- [ ] Existing features not broken
- [ ] localStorage saves/loads correctly (if applicable)
- [ ] Mobile works (if applicable)

**Success Criteria:**
- Feature works as intended
- No regressions in other features
- Ready to show user

### Phase 5: Get User Feedback

**Goal:** Have user test the feature and confirm it matches their vision.

**Steps:**
1. Show the result (screenshot + short description of what works)
2. Ask: "Does this match what you wanted?"
3. Wait for feedback
4. If user approves → go to Phase 6 (Commit)
5. If user requests changes → iterate (go back to implementation and test)

**Possible Responses:**
- "Yes, perfect" → Commit
- "Almost, but X needs to change" → Iterate (implement change, test, show again)
- "This looks good but I want to also add Y" → Scope next feature separately, commit current one
- "Not quite, let me describe better..." → Back to Phase 1 (clarify)

**Iteration Cycle:**
- User feedback → implement change → test → show result → repeat until approved

**Success Criteria:**
- User explicitly approves the implementation
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
4. Test: User can perform action, animation plays, no broken features
5. Commit: "Add petting mechanic"

### New Visual Element (Like Color Picker)

**Flow:**
1. Clarify: Where should it appear? When should it open/close? What options?
2. Propose: Modal? Sidebar? Inline? How does it affect game state?
3. Implement: New component, state, handlers, styling
4. Test: UI renders correctly, color changes apply, game continues running
5. Commit: "Add color picker settings"

### Bug Fix (Like Size Not Persisting)

**Flow:**
1. Clarify: Reproduce the bug, understand the symptom
2. Diagnose: Read code, find root cause
3. Propose: How to fix it? Any side effects?
4. Implement: Minimal fix, no scope creep
5. Test: Bug is fixed, no regressions
6. Commit: "Fix size persistence issue"

### Performance Optimization

**Flow:**
1. Clarify: What's slow? What's the target performance?
2. Propose: Refactor strategy, any tradeoffs?
3. Implement: Code changes with explanation
4. Test: Measure improvement, no visual regressions
5. Commit: "Optimize particle rendering"

### Code Refactoring (Like Extracting Constants)

**Flow:**
1. Clarify: What's being refactored and why?
2. Propose: Which files change? Any behavior changes?
3. Implement: Extract/reorganize, update imports
4. Test: Everything still works, no behavior change
5. Commit: "Extract magic numbers to src/constants/"

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
- [ ] Phase 4: Golden path tested, edge cases handled, no regressions
- [ ] Phase 5: User explicitly approved the implementation
- [ ] Phase 6: Committed to main with correct authorship, pushed to GitHub
- [ ] GitHub Actions passed
- [ ] Feature visible on GitHub Pages (live)

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
