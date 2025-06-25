# RecapMCP Unified Mode - Implementation Handoff

## 🎯 Objective
Simplify RecapMCP to have ONE intelligent mode that automatically provides the best context for resuming work. No choices, no parameters - just smart, contextual recaps.

## 📋 Current State (Too Many Modes)
```
recap {"format": "text"}
recap {"format": "json"} 
recap {"format": "handoff"}
recap {"format": "recovery"}
recap {"verbose": true}
recap {"professional": true}
```

## ✨ Desired End Result (ONE Smart Mode)

### Simple Usage
```
"Give me a recap"
"What was I working on?"
"Recap my recent work"
```

### Unified Output Format

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
RECAP • E-commerce API Project • 45m session
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🎯 INTENT: Debugging JWT authentication error (85% confidence)
You were investigating undefined token errors in the auth middleware

🔍 INVESTIGATION PATH:
"undefined" (47 matches) → "undefined token" (8 matches) → "jwt undefined" (found issue)

📍 CURRENT STATE:
• Working in: /Users/dev/ecommerce-api/src/auth/
• Last file: middleware.js (edited 3m ago)
• Session: 45 minutes, 80% complete

🔥 HOT FILES:
1. middleware.js     ████████ 8 touches (5 reads, 3 edits)
2. auth.test.js     ████     4 touches (4 reads)
3. jwt-utils.js     ██       2 touches (2 reads)

📝 CHANGES MADE:
• middleware.js: Added null check validation (+87 chars, defensive pattern)
  ```javascript
  // Added:
  if (!token || typeof token !== 'string') {
    return res.status(401).json({ error: 'Invalid token format' });
  }
  ```

⚠️ NEEDS ATTENTION:
• middleware.js edited but not tested
• 1 uncommitted file with security fix

🎯 NEXT ACTIONS:
1. Run: npm test auth/middleware.test.js
2. Add test case for null token scenario
3. Commit: "fix: Add null check for JWT validation"

💡 Continue where you left off with complete context!
```

## 🏗️ Implementation Plan

### 1. Remove All Format Options
- Delete `format` parameter from RecapArgsSchema
- Remove `verbose`, `professional` parameters
- Keep only `hours` parameter (hidden from user)

### 2. Intelligent Context Detection
The single mode automatically:
- Detects if session was interrupted (shows recovery info)
- Identifies debugging workflows (shows investigation path)
- Recognizes development patterns (shows relevant context)
- Adapts output based on activity type

### 3. Unified Display Components

#### Always Show:
- Session summary with project and duration
- Intent detection with confidence
- Current state (directory, last file, session info)
- Hot files heatmap with visual bars
- Next actions (specific, not generic)

#### Conditionally Show (when relevant):
- Investigation path (if searches detected)
- Code changes with snippets (if edits made)
- Needs attention warnings (if uncommitted/untested)
- Error context (if error patterns found)

### 4. Smart Defaults
- Default to last 24 hours
- Auto-detect interrupted sessions
- Show code snippets only for recent edits
- Limit file lists to top 5 most relevant
- Use visual indicators (bars, emojis) for quick scanning

### 5. Remove These Files/Functions
- `generateHandoffNote()` - merged into unified
- `generateTextRecap()` - replaced by unified
- `generateQuickRecovery()` - merged into unified
- JSON format export - removed
- Verbose mode logic - always intelligent

### 6. Single Entry Point
```typescript
export async function handleRecap(args: { hours?: number }): Promise<string> {
  // Smart unified recap that adapts to context
  return generateUnifiedRecap(sessions, currentState);
}
```

## 📁 Files to Modify

1. **types.ts**
   - Simplify RecapArgsSchema to only have `hours`
   - Remove format enums

2. **recap.ts**
   - Create new `generateUnifiedRecap()` function
   - Remove all format-specific functions
   - Always include enhanced tracking

3. **recovery.ts**
   - Keep detection logic
   - Merge display into unified format

4. **server.ts**
   - Update tool description to remove format options

## 🎨 Design Principles

1. **No Choices** - One mode that's always smart
2. **Context-Aware** - Adapts based on what you were doing
3. **Actionable** - Always provides specific next steps
4. **Visual** - Quick scanning with bars, emojis, formatting
5. **Complete** - Everything needed to resume work

## ✅ Success Criteria

- User types "recap" with no parameters
- Gets rich, contextual output automatically
- Can resume work immediately with full context
- No confusion about which mode to use
- Saves time by eliminating choices

## 🚀 Next Session Tasks

1. Show this design for approval
2. Implement unified mode
3. Remove all format options
4. Test with various scenarios
5. Update documentation

---

**Key Message**: One intelligent recap mode that automatically provides everything needed to resume work. No choices, just smart context.