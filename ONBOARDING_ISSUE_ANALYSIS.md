# Onboarding Wizard Issue Analysis

## The Problem
**Error:** `ReferenceError: Cannot access 'k' before initialization`

This error occurs when the OnboardingWizard component is imported into Calculator.jsx, causing a white screen.

## Root Cause Analysis

### 1. **Icon Import Conflicts**
The error message "Cannot access 'k' before initialization" suggests a circular dependency or hoisting issue with lucide-react icons.

**Evidence:**
- Multiple UI components import icons from lucide-react:
  - `toast.jsx` → `X`
  - `select.jsx` → `Check, ChevronDown, ChevronUp`
  - `checkbox.jsx` → `Check`
  - `dropdown-menu.jsx` → `Check, ChevronRight, Circle`
  - `menubar.jsx` → `Check, ChevronRight, Circle`
  - `calendar.jsx` → `ChevronLeft, ChevronRight`
  - `carousel.jsx` → `ArrowLeft, ArrowRight`
  - And many more...

- OnboardingWizard imports:
  ```javascript
  ArrowRight, ArrowLeft, Check, Sparkles, Zap, Target, X
  ```

### 2. **Potential Circular Dependency Chain**
```
Calculator.jsx
  → OnboardingWizard.jsx
    → Button, Input, Label, Card (UI components)
      → Some of these may import icons
        → lucide-react
          → Conflict with OnboardingWizard's icon imports
```

### 3. **Why It Breaks**
When Vite bundles the code:
1. It tries to optimize imports from lucide-react
2. Multiple components importing the same icons (Check, X, etc.)
3. The bundler creates a shared reference
4. OnboardingWizard's icons get hoisted/optimized
5. Initialization order gets confused
6. Result: "Cannot access 'k' before initialization"

## Solutions (Ranked by Difficulty)

### ✅ **EASIEST: Skip the Feature**
- **Effort:** 0 minutes (already done)
- **Status:** ✅ Working
- **Trade-off:** No onboarding wizard

---

### 🟡 **EASY: Use Dynamic Import**
Load the onboarding wizard only when needed, breaking the circular dependency.

**Implementation:**
```javascript
// Calculator.jsx
const [OnboardingWizard, setOnboardingWizard] = useState(null);

useEffect(() => {
  // Dynamically import only when needed
  if (!onboardingCompleted && !onboardingSkipped) {
    import('../components/onboarding/OnboardingWizard').then(module => {
      setOnboardingWizard(() => module.default);
    });
  }
}, []);

// Render
{OnboardingWizard && <OnboardingWizard open={showOnboarding} ... />}
```

**Pros:**
- Breaks circular dependency
- Lazy loads the component
- Smaller initial bundle

**Cons:**
- Slight delay before wizard appears
- More complex code

**Effort:** ~10 minutes

---

### 🟡 **MEDIUM: Create Icon Barrel Export**
Centralize all icon imports to avoid conflicts.

**Implementation:**
```javascript
// src/components/icons/index.js
export {
  ArrowRight as ArrowRightIcon,
  ArrowLeft as ArrowLeftIcon,
  Check as CheckIcon,
  // ... all other icons
} from "lucide-react";

// Then import from this file everywhere
import { CheckIcon, XIcon } from "@/components/icons";
```

**Pros:**
- Single source of truth for icons
- Easier to manage
- Better tree-shaking

**Cons:**
- Need to update ALL files that import icons
- 20+ files to modify

**Effort:** ~30-45 minutes

---

### 🔴 **HARD: Rewrite Without Shared Icons**
Use different icons or inline SVGs for the onboarding wizard.

**Implementation:**
- Replace lucide-react icons with custom SVGs
- Or use emoji/text instead of icons

**Pros:**
- No dependency conflicts
- Lighter bundle

**Cons:**
- Need to create/find SVGs
- Styling complexity
- Time-consuming

**Effort:** ~1 hour

---

### 🔴 **HARDEST: Debug Vite Bundle**
Deep dive into the Vite build process to understand the exact conflict.

**Implementation:**
- Analyze the bundle with `vite-bundle-visualizer`
- Check Vite's module graph
- Adjust rollup options
- Potentially configure manual chunks

**Pros:**
- Fixes root cause
- Better understanding of build process

**Cons:**
- Very technical
- May not find a solution
- Could break other things

**Effort:** ~2-3 hours (with no guarantee of success)

---

## Recommended Approach

### **Option 1: Dynamic Import (10 min)**
This is the quickest fix that will work reliably. The onboarding wizard isn't critical to core functionality, so a slight delay is acceptable.

### **Option 2: Skip It (0 min)**
The site works perfectly without it. Focus on features that generate revenue.

## My Recommendation
**Go with Dynamic Import.** It's a clean solution that:
- Takes 10 minutes
- Fixes the issue permanently
- Doesn't require refactoring 20+ files
- Actually improves performance (lazy loading)

Want me to implement the dynamic import solution?
