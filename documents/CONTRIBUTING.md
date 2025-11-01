# Contributing to Resolvera

Thank you for your interest in contributing to Resolvera! This document provides guidelines and instructions for contributing to the project.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Coding Standards](#coding-standards)
- [Commit Guidelines](#commit-guidelines)
- [Pull Request Process](#pull-request-process)
- [Testing](#testing)
- [Documentation](#documentation)

---

## Code of Conduct

### Our Pledge

We are committed to providing a welcoming and inspiring community for all. Please be respectful and constructive in all interactions.

### Our Standards

**Positive behavior includes:**
- Using welcoming and inclusive language
- Being respectful of differing viewpoints
- Gracefully accepting constructive criticism
- Focusing on what is best for the community
- Showing empathy towards other community members

**Unacceptable behavior includes:**
- Trolling, insulting comments, or personal attacks
- Public or private harassment
- Publishing others' private information without permission
- Other conduct which could reasonably be considered inappropriate

---

## Getting Started

### Prerequisites

- **Node.js** 20.x or higher
- **PostgreSQL** 16 or higher
- **Git** for version control
- **Code editor** (VS Code recommended)

### Initial Setup

1. **Fork the repository**
   ```bash
   # Visit https://gitea.stull-group.com/iceflier/resolvera
   # Click "Fork" button
   ```

2. **Clone your fork**
   ```bash
   git clone https://gitea.stull-group.com/YOUR-USERNAME/resolvera.git
   cd resolvera
   ```

3. **Add upstream remote**
   ```bash
   git remote add upstream https://gitea.stull-group.com/iceflier/resolvera.git
   ```

4. **Install dependencies**
   ```bash
   npm install
   ```

5. **Setup database**
   ```bash
   sudo -u postgres psql -c "CREATE DATABASE resolvera_dev;"
   sudo -u postgres psql -c "CREATE USER resolvera WITH PASSWORD 'dev-password';"
   sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE resolvera_dev TO resolvera;"
   ```

6. **Configure environment**
   ```bash
   cp .env.example .env
   # Edit .env with your development settings
   ```

7. **Run migrations**
   ```bash
   npx prisma migrate deploy
   ```

8. **Start development server**
   ```bash
   npm run dev
   ```

---

## Development Workflow

### Branch Strategy

- `main` - Stable production code
- `develop` - Integration branch for features
- `feature/*` - New features
- `fix/*` - Bug fixes
- `docs/*` - Documentation updates

### Creating a Feature Branch

```bash
# Update your local main
git checkout main
git pull upstream main

# Create feature branch
git checkout -b feature/your-feature-name
```

### Making Changes

1. **Write code** following our [coding standards](#coding-standards)
2. **Test changes** locally
3. **Update documentation** if needed
4. **Commit changes** following [commit guidelines](#commit-guidelines)

### Keeping Your Branch Updated

```bash
# Fetch upstream changes
git fetch upstream

# Rebase your branch
git checkout feature/your-feature-name
git rebase upstream/main
```

---

## Coding Standards

### TypeScript Guidelines

**Use strict typing:**
```typescript
// ✅ Good
interface User {
  id: string;
  email: string;
  role: 'admin' | 'user';
}

// ❌ Avoid
interface User {
  id: any;
  email: string;
  role: string;
}
```

**Prefer const over let:**
```typescript
// ✅ Good
const apiToken = getToken();

// ❌ Avoid (unless reassignment is needed)
let apiToken = getToken();
```

**Use async/await over promises:**
```typescript
// ✅ Good
async function fetchUser(id: string) {
  const user = await prisma.user.findUnique({ where: { id } });
  return user;
}

// ❌ Avoid
function fetchUser(id: string) {
  return prisma.user.findUnique({ where: { id } })
    .then(user => user);
}
```

### React Component Guidelines

**Use functional components with hooks:**
```typescript
// ✅ Good
export default function UserCard({ user }: { user: User }) {
  const [isExpanded, setIsExpanded] = useState(false);
  return <div>...</div>;
}

// ❌ Avoid class components
export default class UserCard extends React.Component { ... }
```

**Extract reusable hooks:**
```typescript
// hooks/useUser.ts
export function useUser(userId: string) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUser(userId).then(setUser).finally(() => setLoading(false));
  }, [userId]);

  return { user, loading };
}
```

### File Organization

**Follow the existing structure:**
```
lib/
├── auth/           # Authentication utilities
├── api/            # API helpers
├── services/       # External services
└── utils/          # General utilities

app/
├── api/            # API routes
├── dashboard/      # Dashboard page + components
└── [feature]/      # Feature pages
```

**Export patterns:**
```typescript
// ✅ Named exports for utilities
export function validateEmail(email: string): boolean { ... }
export function hashPassword(password: string): Promise<string> { ... }

// ✅ Default export for components
export default function LoginPage() { ... }
```

### API Route Standards

**Use response helpers:**
```typescript
import { successResponse, errorResponse, validationErrorResponse } from '@/lib/api/responses';

export async function POST(request: NextRequest) {
  return requireAuth(request, async (req: AuthenticatedRequest) => {
    try {
      const body = await request.json();

      // Validate input
      const validation = validateSchema(schema, body);
      if (!validation.success) {
        return validationErrorResponse(validation.errors || []);
      }

      // Process request
      const result = await processRequest(validation.data);

      return successResponse(result);
    } catch (error) {
      console.error('Error:', error);
      return errorResponse(error, 500);
    }
  });
}
```

**Use authentication middleware:**
```typescript
import { requireAuth, getRequestUser } from '@/lib/auth/middleware';

export async function GET(request: NextRequest) {
  return requireAuth(request, async (req: AuthenticatedRequest) => {
    const user = getRequestUser(req);
    // ... handle authenticated request
  });
}
```

### Security Best Practices

1. **Always validate input** with Zod schemas
2. **Never log sensitive data** (passwords, tokens, etc.)
3. **Use parameterized queries** (Prisma handles this)
4. **Check authorization** before any data access
5. **Encrypt sensitive data** before storage
6. **Add audit logging** for security-relevant operations

---

## Commit Guidelines

### Commit Message Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code formatting (no logic changes)
- `refactor`: Code restructuring (no behavior changes)
- `perf`: Performance improvements
- `test`: Adding or updating tests
- `chore`: Build process or tooling changes

**Examples:**
```
feat(watcher): add IPv6 support for IP monitoring

- Update background checker to support AAAA records
- Add IPv6 API endpoint (api6.ipify.org)
- Update UI to display IPv6 addresses

Closes #123
```

```
fix(auth): prevent session cookie from being cleared on refresh

The JWT cookie was being deleted on page refresh due to incorrect
SameSite attribute. Changed from 'strict' to 'lax' to allow
cross-origin navigation while maintaining CSRF protection.

Fixes #456
```

### Commit Best Practices

- **Keep commits atomic** - One logical change per commit
- **Write descriptive messages** - Explain why, not just what
- **Reference issues** - Use "Closes #123" or "Fixes #456"
- **Sign commits** if possible (GPG signatures)

---

## Pull Request Process

### Before Submitting

1. **Update your branch** with latest upstream changes
2. **Run linter** and fix any issues
   ```bash
   npm run lint
   ```
3. **Build the project** to check for TypeScript errors
   ```bash
   npm run build
   ```
4. **Test your changes** thoroughly
5. **Update documentation** if needed

### Creating a Pull Request

1. **Push your branch** to your fork
   ```bash
   git push origin feature/your-feature-name
   ```

2. **Create PR** on the repository
   - Provide clear title and description
   - Reference related issues
   - Add screenshots for UI changes
   - List breaking changes if any

3. **PR Template:**
   ```markdown
   ## Description
   Brief description of changes

   ## Type of Change
   - [ ] Bug fix
   - [ ] New feature
   - [ ] Breaking change
   - [ ] Documentation update

   ## Testing
   - How were changes tested?
   - What test cases were covered?

   ## Screenshots (if applicable)
   [Add screenshots here]

   ## Checklist
   - [ ] Code follows project style guidelines
   - [ ] Self-review completed
   - [ ] Comments added for complex code
   - [ ] Documentation updated
   - [ ] No new warnings generated
   - [ ] Tested locally
   ```

### Review Process

1. **Maintainers will review** your PR
2. **Address feedback** by pushing additional commits
3. **Once approved**, maintainer will merge

### After Merge

1. **Delete your branch**
   ```bash
   git branch -d feature/your-feature-name
   git push origin --delete feature/your-feature-name
   ```

2. **Update your main**
   ```bash
   git checkout main
   git pull upstream main
   ```

---

## Testing

### Manual Testing

1. **Start dev server**
   ```bash
   npm run dev
   ```

2. **Test all affected features**
   - Create test data in UI
   - Verify expected behavior
   - Check edge cases
   - Test error handling

3. **Test in different browsers**
   - Chrome/Edge
   - Firefox
   - Safari (if available)

### Database Migrations

**Creating a migration:**
```bash
npx prisma migrate dev --name descriptive_migration_name
```

**Testing migrations:**
```bash
# Reset database
npx prisma migrate reset

# Apply migrations
npx prisma migrate deploy
```

---

## Documentation

### When to Update Documentation

- **New features** - Add to README and feature docs
- **API changes** - Update API.md
- **Configuration changes** - Update setup guides
- **Architecture changes** - Update ARCHITECTURE.md

### Documentation Standards

- **Use clear language** - Write for all skill levels
- **Include examples** - Show practical usage
- **Add screenshots** - For UI features
- **Keep updated** - Remove outdated information

---

## Getting Help

- **Questions**: Open a discussion in the repository
- **Bugs**: Open an issue with detailed reproduction steps
- **Security**: Contact maintainers privately (do not open public issues)

---

## Recognition

Contributors will be recognized in:
- CHANGELOG.md for significant contributions
- README.md acknowledgments section
- Git commit history

---

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

---

**Thank you for contributing to Resolvera! 🎉**
