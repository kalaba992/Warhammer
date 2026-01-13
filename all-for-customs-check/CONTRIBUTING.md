# Contributing to Carinski Alat

First off, thank you for considering contributing to Carinski Alat! It's people like you that make this customs classification tool better for everyone.

## 🎯 Project Vision

Carinski Alat is a legally-critical application for customs HS code classification with:
- **Zero tolerance for AI hallucinations**
- **Legal defensibility** as top priority
- **Multi-language support** for accessibility
- **Production-ready code** quality

## 📋 Table of Contents

- [Code of Conduct](#code-of-conduct)
- [How Can I Contribute?](#how-can-i-contribute)
- [Development Setup](#development-setup)
- [Coding Standards](#coding-standards)
- [Commit Guidelines](#commit-guidelines)
- [Pull Request Process](#pull-request-process)

## 📜 Code of Conduct

### Our Standards

- **Be Respectful**: Treat everyone with respect and professionalism
- **Be Constructive**: Provide constructive feedback
- **Be Inclusive**: Welcome newcomers and diverse perspectives
- **Be Professional**: This is a legal/government tool - maintain high standards

## 🤝 How Can I Contribute?

### Reporting Bugs

**Before Submitting:**
1. Check existing issues
2. Verify it's reproducible
3. Test in latest version

**Bug Report Template:**
```markdown
**Description**
Clear description of the bug

**To Reproduce**
1. Go to '...'
2. Click on '...'
3. See error

**Expected Behavior**
What should happen

**Screenshots**
If applicable

**Environment**
- Browser: [e.g. Chrome 120]
- OS: [e.g. Windows 11]
- Version: [e.g. 1.0.0]
```

### Suggesting Enhancements

**Enhancement Template:**
```markdown
**Feature Description**
Clear description of the feature

**Use Case**
Why is this needed?

**Proposed Solution**
How should it work?

**Alternatives Considered**
Other approaches you've thought about
```

### Pull Requests

We actively welcome your pull requests!

**Areas Needing Help:**
- 🌍 Additional language translations
- 📚 HS code data expansion
- 🧪 Test coverage improvements
- 📝 Documentation enhancements
- 🎨 UI/UX improvements
- 🐛 Bug fixes

## 🛠️ Development Setup

### Prerequisites

- Node.js 18+ 
- npm or pnpm
- Git
- Code editor (VS Code recommended)

### Setup Steps

1. **Fork & Clone**
   ```bash
   git clone https://github.com/YOUR_USERNAME/all-for-customs.git
   cd all-for-customs
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Environment Variables**
   ```bash
   cp .env.example .env
  # Add your OPENAI_API_KEY (server-side; do not use VITE_ prefix)
   ```

4. **Start Development**
   ```bash
   npm run dev
   ```

5. **Open Browser**
   - Navigate to `http://localhost:5173`

### Project Structure

```
src/
├── components/       # React components
│   ├── ui/          # Shadcn components (don't modify)
│   └── *.tsx        # Custom components
├── hooks/           # Custom React hooks
├── lib/             # Utilities and services
├── types/           # TypeScript types
├── App.tsx          # Main app component
└── index.css        # Global styles
```

## 📏 Coding Standards

### TypeScript

- **Always use TypeScript** - No plain JavaScript
- **Define types** for all props and functions
- **Use interfaces** for objects, types for unions
- **Avoid `any`** - Use `unknown` if needed

```typescript
// ✅ Good
interface ClassificationResult {
  hsCode: string
  confidence: 'high' | 'medium' | 'low'
  reasoning: string[]
}

// ❌ Bad
function classify(data: any): any {
  // ...
}
```

### React

- **Functional components** only
- **Hooks for state** - No class components
- **Props destructuring** in function signature
- **Named exports** for components

```typescript
// ✅ Good
export function ChatInterface({ messages, onSend }: ChatInterfaceProps) {
  const [input, setInput] = useState('')
  // ...
}

// ❌ Bad
export default (props: any) => {
  // ...
}
```

### Styling

- **TailwindCSS** for all styling
- **Use design tokens** from theme
- **Responsive** by default (mobile-first)
- **Consistent spacing** using Tailwind scale

```tsx
// ✅ Good
<div className="flex flex-col gap-4 p-6 bg-card rounded-lg">

// ❌ Bad
<div style={{ display: 'flex', padding: '24px' }}>
```

### Naming Conventions

- **Components**: PascalCase (`ChatInterface.tsx`)
- **Functions**: camelCase (`classifyProduct`)
- **Constants**: UPPER_SNAKE_CASE (`MAX_FILE_SIZE`)
- **Types**: PascalCase (`ClassificationResult`)
- **Files**: kebab-case for non-components (`ai-service.ts`)

### Comments

- **Avoid obvious comments** - Code should be self-documenting
- **Use JSDoc** for complex functions
- **Explain WHY not WHAT** - Code shows what, comments explain why

```typescript
// ✅ Good
// We need to delay validation to avoid race conditions with the KV store
await sleep(100)

// ❌ Bad
// Set the value to true
setIsProcessing(true)
```

## 🔒 Security Guidelines

### Critical Rules

1. **Never commit API keys** or secrets
2. **Sanitize all user input** before processing
3. **Validate HS codes** against known database
4. **No client-side secrets** - Use env vars
5. **HTTPS only** in production

### Anti-Hallucination

This is **critical** for this application:

```typescript
// ✅ Always validate AI output
const result = await classifyWithAI(description)
if (!isValidHSCode(result.hsCode)) {
  throw new Error('Invalid HS code detected')
}

// ❌ Never trust AI blindly
return await classifyWithAI(description)
```

## 📝 Commit Guidelines

### Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting)
- `refactor`: Code refactoring
- `test`: Adding tests
- `chore`: Maintenance tasks

### Examples

```bash
feat(classification): add confidence scoring

Implement three-level confidence scoring based on AI certainty
and validation results. Scores: high (>90%), medium (70-90%), 
low (<70%).

Closes #123

---

fix(batch-upload): prevent memory leak in file processing

Fixed memory leak caused by not cleaning up FileReader instances
after processing large batches of documents.

Fixes #456

---

docs(readme): update deployment instructions

Added Cloudflare Pages deployment steps and troubleshooting guide.
```

## 🔄 Pull Request Process

### Before Submitting

1. **Update from main**
   ```bash
   git checkout main
   git pull origin main
   git checkout your-branch
   git rebase main
   ```

2. **Test your changes**
   ```bash
   npm run type-check
   npm run lint
   npm run build
   ```

3. **Update documentation** if needed

### PR Template

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
How was this tested?

## Screenshots
If UI changes

## Checklist
- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Comments added for complex code
- [ ] Documentation updated
- [ ] No new warnings
- [ ] Tests added/updated
```

### Review Process

1. **Automated checks** must pass
2. **At least one approval** required
3. **No merge conflicts**
4. **Documentation** updated if needed

## 🌍 Translation Contributions

Adding new languages? Follow this:

1. **Add to `translations.ts`**:
   ```typescript
   export const translations = {
     newLang: {
       greeting: 'Translation here',
       // ... all keys
     }
   }
   ```

2. **Update language selector** in `LanguageSettings.tsx`

3. **Test all UI elements** in new language

4. **Provide native speaker review** if possible

## 🧪 Testing Guidelines

### Test Coverage Priorities

1. **Classification validation** (critical)
2. **Data persistence** (critical)
3. **AI hallucination prevention** (critical)
4. **UI functionality** (important)
5. **Edge cases** (important)

### Writing Tests

```typescript
import { describe, it, expect } from 'vitest'

describe('HS Code Validation', () => {
  it('should reject invalid HS codes', () => {
    expect(isValidHSCode('9999.99.99')).toBe(false)
  })

  it('should accept valid HS codes', () => {
    expect(isValidHSCode('1101.00.10')).toBe(true)
  })
})
```

## ❓ Questions?

- **General questions**: Open a discussion on GitHub
- **Bug reports**: Open an issue
- **Security issues**: Email directly (don't open public issue)

## 📄 License

By contributing, you agree that your contributions will be licensed under the same license as the project.

## 🙏 Thank You!

Every contribution, no matter how small, makes a difference. Thank you for helping make customs classification more accessible and reliable!

---

**Remember**: This application has **zero tolerance for hallucinations**. When in doubt, ask for clarification rather than making assumptions.
