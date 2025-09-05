# ScaffoldJS 🏗️

[![npm version](https://badge.fury.io/js/@ebukaodini%2Fscaffoldjs.svg)](https://badge.fury.io/js/@ebukaodini%2Fscaffoldjs)
![build](https://img.shields.io/github/actions/workflow/status/ebukaodini/scaffold.js/publish.yml?branch=main)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)


A powerful CLI tool for scaffolding code templates with multi-variable support. Generate consistent, organized code structures across your projects with customizable templates and flexible variable transformations.

## ✨ Features

- **🎯 Multi-Variable Support** - Use multiple custom variables like `module`, `feature`, `domain`, etc.
- **🔄 Smart Transformations** - Built-in case transformations (camelCase, PascalCase, snake_case, etc.)
- **📁 Flexible Structure** - Generate files in any directory structure
- **💉 Template Injection** - Inject code snippets into existing files
- **👥 Template Groups** - Generate multiple related files at once
- **🔧 Configurable** - JSON-based configuration for all templates
- **⚡ CLI Friendly** - Simple, intuitive command-line interface
- **🔄 Backward Compatible** - Works with existing single-variable setups

## 🚀 Quick Start

```bash
# Install globally
npm install -g scaffoldjs

# Or use directly with npx
npx scaffold help
```

### Initialize Your Project

```bash
# Set up configuration and default templates
npx scaffold setup

# View available templates
npx scaffold list

# Get help
npx scaffold help

# View comprehensive guide
npx scaffold guide
```

## 📖 Usage

### Basic Commands

```bash
# Generate a single file
npx scaffold make user controller

# Generate with custom variables
npx scaffold make table controller -v module=restaurant feature=dining

# Generate multiple files using a group
npx scaffold make booking crud-group -v module=hotel feature=reservations

# Inject code into existing files
npx scaffold inject import-statement src/app.module.ts -v module=auth

# Force overwrite existing files
npx scaffold make order service -v module=ecommerce --force
```

### Command Reference

| Command | Description | Example |
|---------|-------------|---------|
| `setup` | Initialize scaffoldjs in your project | `npx scaffold setup` |
| `list` | Show available templates and groups | `npx scaffold list` |
| `make <resource> <template>` | Generate new files from templates | `npx scaffold make user controller` |
| `inject <template> <file>` | Inject code into existing files | `npx scaffold inject method src/user.service.ts` |
| `help` | Display help information | `npx scaffold help` |
| `guide` | Show comprehensive usage guide | `npx scaffold guide` |

### Options

| Option | Short | Description | Example |
|--------|-------|-------------|---------|
| `--vars` | `-v` | Custom variables in key=value format | `-v module=auth feature=users` |
| `--force` | `-f` | Force overwrite existing files | `--force` |
| `--target` | `-t` | Target point for injection | `-t "// inject:methods"` |
| `--resource` | `-r` | Resource name for injection | `-r user` |

## ⚙️ Configuration

### scaffold.config.json

The configuration file defines your templates, injection points, and groups:

```json
{
  "version": 1,
  "templates": {
    "controller": {
      "description": "Generate a controller file",
      "src": "./scaffolds/controller.tp",
      "dest": "./src/{{module}}/controllers/{{resource.singular.lowerCase}}.controller.ts"
    },
    "service": {
      "description": "Generate a service file", 
      "src": "./scaffolds/service.tp",
      "dest": "./src/{{module}}/services/{{resource.singular.lowerCase}}.service.ts"
    },
    "import-statement": {
      "description": "Import statement for injection",
      "src": "./scaffolds/{{feature}}-import.tp",
      "dest": "inject"
    },
    "crud-group": [
      "controller",
      "service", 
      "dto",
      "entity"
    ]
  }
}
```

### Template Structure

```
your-project/
├── scaffold.config.json
├── scaffolds/
│   ├── controller.tp
│   ├── service.tp
│   ├── dto.tp
│   └── auth-import.tp
└── src/
    └── (generated files will go here)
```

## 🔧 Variables & Transformations

### Built-in Variables

- **`resource`** - Automatically provided primary variable
- **Custom variables** - Any variables you define (module, feature, domain, etc.)

### Available Transformations

| Transformation | Example Input | Example Output |
|----------------|---------------|----------------|
| `raw` | `user-account` | `user-account` |
| `singular` | `users` | `user` |
| `plural` | `user` | `users` |
| `lowerCase` | `UserAccount` | `useraccount` |
| `upperCase` | `user` | `USER` |
| `camelCase` | `user-account` | `userAccount` |
| `pascalCase` | `user-account` | `UserAccount` |
| `snakeCase` | `user-account` | `user_account` |
| `spaceCase` | `user-account` | `user account` |
| `hyphenCase` | `user account` | `user-account` |
| `sentenceCase` | `user-account` | `Useraccount` |

### Chaining Transformations

```txt
{{resource.singular.pascalCase}}     // user-accounts → UserAccount
{{module.plural.upperCase}}          // auth → AUTHS
{{feature.singular.camelCase}}       // dining-tables → diningTable
```

## 📝 Template Examples

### Controller Template (`scaffolds/controller.tp`)

```typescript
import { Controller, Get, Post, Put, Delete, Body, Param } from '@nestjs/common';
import { {{resource.singular.pascalCase}}Service } from '../services/{{resource.singular.lowerCase}}.service';
import { Create{{resource.singular.pascalCase}}Dto } from '../dto/{{resource.singular.lowerCase}}.dto';

@Controller('{{module}}/{{feature}}/{{resource.plural.lowerCase}}')
export class {{resource.singular.pascalCase}}Controller {
  constructor(
    private readonly {{resource.singular.camelCase}}Service: {{resource.singular.pascalCase}}Service
  ) {}

  @Get()
  async findAll{{resource.plural.pascalCase}}() {
    return this.{{resource.singular.camelCase}}Service.findAll();
  }

  @Post()
  async create{{resource.singular.pascalCase}}(@Body() dto: Create{{resource.singular.pascalCase}}Dto) {
    return this.{{resource.singular.camelCase}}Service.create(dto);
  }
}

// Generated for {{module}} module, {{feature}} feature
```

### Import Injection Template (`scaffolds/auth-import.tp`)

```typescript
import { {{resource.singular.pascalCase}}Module } from './{{module}}/{{resource.singular.lowerCase}}.module';
```

## 🎯 Real-World Examples

### E-commerce Application

```bash
# Generate product management
npx scaffold make product crud-group -v module=catalog feature=products

# Generate order processing
npx scaffold make order service -v module=sales feature=checkout

# Add authentication
npx scaffold make user controller -v module=auth feature=users
```

**Generated structure:**
```
src/
├── catalog/
│   ├── controllers/product.controller.ts
│   ├── services/product.service.ts
│   ├── dto/product.dto.ts
│   └── entities/product.entity.ts
├── sales/
│   └── services/order.service.ts
└── auth/
    └── controllers/user.controller.ts
```

### Hotel Management System

```bash
# Room management
npx scaffold make room full-feature -v module=hotel feature=rooms

# Booking system  
npx scaffold make booking crud-group -v module=reservations feature=bookings

# Guest services
npx scaffold make guest service -v module=hospitality feature=guests
```

### Multi-tenant SaaS

```bash
# Tenant management
npx scaffold make tenant controller -v module=core domain=admin

# Feature modules per tenant
npx scaffold make dashboard service -v module=analytics domain=tenant

# Billing system
npx scaffold make invoice crud-group -v module=billing domain=finance
```

## 💉 Code Injection

Inject code snippets into existing files at specific points:

```bash
# Inject import statements
npx scaffold inject import-statement src/app.module.ts -v module=auth

# Inject methods into services
npx scaffold inject crud-methods src/user.service.ts -r user

# Inject routes with target point
npx scaffold inject api-route src/app.routes.ts -t "// inject:routes" -v module=auth
```

### Injection Targets

- **Automatic placement** - Top/bottom of file (prompted)
- **Specific markers** - `// inject:imports`, `<!-- inject:methods -->`, etc.
- **Duplicate prevention** - Automatically skips if content already exists

## 🔄 Migration from Single Variable

Existing templates using only `{{resource}}` variables continue to work seamlessly:

```typescript
// Old template - still works
export class {{resource.pascalCase}}Service {}

// New multi-variable template
export class {{resource.pascalCase}}Service {
  // Module: {{module}}
  // Feature: {{feature}}
}
```

## 🛠️ Advanced Configuration

### Dynamic Template Paths

```json
{
  "templates": {
    "feature-controller": {
      "src": "./scaffolds/{{feature}}/controller.tp",
      "dest": "./src/{{module}}/{{feature}}/{{resource.plural.lowerCase}}.controller.ts"
    }
  }
}
```

### Conditional Templates

```json
{
  "templates": {
    "api-controller": {
      "src": "./scaffolds/{{module}}/api-controller.tp", 
      "dest": "./src/{{module}}/controllers/{{resource.singular.lowerCase}}.controller.ts"
    },
    "web-controller": {
      "src": "./scaffolds/{{module}}/web-controller.tp",
      "dest": "./src/{{module}}/controllers/{{resource.singular.lowerCase}}.controller.ts" 
    }
  }
}
```

<!-- ## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

### Development Setup

```bash
git clone https://github.com/ebukaodini/scaffold.js.git
cd scaffoldjs
npm install
npm run build
npm link
``` -->

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- **Issues**: [GitHub Issues](https://github.com/ebukaodini/scaffold.js/issues)
- **Discussions**: [GitHub Discussions](https://github.com/ebukaodini/scaffold.js/discussions)
- **Documentation**: Run `npx scaffold guide` for comprehensive documentation

## ☕️ Support the Project

If ScaffoldJS has saved you time and helped improve your development workflow, consider buying us a coffee! Your support helps us maintain and improve the project.

[![Buy Me A Coffee](https://img.shields.io/badge/Buy%20Me%20A%20Coffee-support%20development-orange?style=for-the-badge&logo=buy-me-a-coffee&logoColor=white)](https://www.buymeacoffee.com/ebukaodini)

**Other ways to support:**
- ⭐ **Star the project** on GitHub
- 🐛 **Report bugs** and suggest features  
- 📖 **Improve documentation**
- 📢 **Share with your team** and on social media
<!-- - 🤝 **Contribute code** (see [Contributing Guide](CONTRIBUTING.md)) -->

Every contribution, no matter how small, helps make ScaffoldJS better for everyone! 🙏

## 🗺️ Roadmap

- [ ] **Custom Transformations** - User-defined transformation functions
- [ ] **Template Inheritance** - Template extending and composition
- [ ] **IDE Integration** - VSCode extension
- [ ] **Interactive Mode** - Guided template generation
- [ ] **Template Marketplace** - Community template sharing
- [ ] **TypeScript Definitions** - Better IntelliSense support

---

**Made with ❤️ by Ebuka Odini**

*Scaffold smarter, code faster!* 🚀