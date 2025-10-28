# 🚀 RudderStack React Provider

<div align="center">

[![npm version](https://badge.fury.io/js/rudderstack-react-provider.svg)](https://badge.fury.io/js/rudderstack-react-provider)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-Ready-blue.svg)](https://www.typescriptlang.org/)

**A modern, type-safe React wrapper for RudderStack analytics with automatic event tracking**

[Installation](#-installation) • [Quick Start](#-quick-start) • [Configuration](#️-configuration) • [Usage](#-usage) • [Examples](#-examples)

</div>

---

## ✨ Features

- 🎯 **Easy Integration** - Drop-in React provider with minimal setup
- 🔄 **Automatic Tracking** - Track clicks and page views automatically
- 🏷️ **Data Attributes** - Simple HTML data attributes for event tracking
- 📱 **Next.js Ready** - Full support for Next.js App Router and Pages Router
- 🔧 **TypeScript** - Full TypeScript support with type definitions
- 🚀 **Modern Build** - ESM & CJS support, optimized for modern bundlers
- ⚡ **Zero Dependencies** - Only peer dependencies on React and RudderStack

## 📦 Installation

```bash
npm install rudderstack-react-provider @rudderstack/analytics-js
```

```bash
yarn add rudderstack-react-provider @rudderstack/analytics-js
```

```bash
pnpm add rudderstack-react-provider @rudderstack/analytics-js
```

## 🚀 Quick Start

### 1. Environment Variables

Create a `.env.local` file in your project root:

```env
RUDDERSTACK_KEY=your_write_key_here
RUDDERSTACK_URL=your_data_plane_url
RUDDERSTACK_GAME_ID=your_game_id
RUDDERSTACK_PROJECT_ID=your_project_id
RUDDERSTACK_LOG=true
RUDDERSTACK_TRACKED_PAGES=/,/search,/preview,/[slug]
```

### 2. Next.js Configuration

Update your `next.config.mjs`:

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    RUDDERSTACK_LOG: process.env.RUDDERSTACK_LOG,
    RUDDERSTACK_KEY: process.env.RUDDERSTACK_KEY,
    RUDDERSTACK_URL: process.env.RUDDERSTACK_URL,
    RUDDERSTACK_GAME_ID: process.env.RUDDERSTACK_GAME_ID,
    RUDDERSTACK_PROJECT_ID: process.env.RUDDERSTACK_PROJECT_ID,
    RUDDERSTACK_TRACKED_PAGES: process.env.RUDDERSTACK_TRACKED_PAGES,
  },
};

export default nextConfig;
```

### 3. Setup Provider

**For Next.js App Router:**

```tsx
// app/providers.tsx
"use client";

import { RudderAnalyticsProvider } from "rudderstack-react-provider";
import { ReactNode } from "react";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <RudderAnalyticsProvider>
      {children}
    </RudderAnalyticsProvider>
  );
}
```

```tsx
// app/layout.tsx
import { Providers } from "./providers";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
```

**For Next.js Pages Router:**

```tsx
// pages/_app.tsx
import type { AppProps } from "next/app";
import { RudderAnalyticsProvider } from "rudderstack-react-provider";

export default function App({ Component, pageProps }: AppProps) {
  return (
    <RudderAnalyticsProvider>
      <Component {...pageProps} />
    </RudderAnalyticsProvider>
  );
}
```

**For Regular React App:**

```tsx
// App.tsx
import { RudderAnalyticsProvider } from "rudderstack-react-provider";

function App() {
  return (
    <RudderAnalyticsProvider>
      <YourAppComponents />
    </RudderAnalyticsProvider>
  );
}
```

## ⚙️ Configuration

### Environment Variables

| Variable | Description | Required | Example |
|----------|-------------|----------|---------|
| `RUDDERSTACK_KEY` | Your RudderStack write key | ✅ | `2Dxxxxxxxxxxxx` |
| `RUDDERSTACK_URL` | RudderStack data plane URL | ✅ | `https://yourname.dataplane.rudderstack.com` |
| `RUDDERSTACK_GAME_ID` | Game identifier | ✅ | `my-game` |
| `RUDDERSTACK_PROJECT_ID` | Project identifier | ✅ | `my-project` |
| `RUDDERSTACK_LOG` | Enable debug logging | ❌ | `true` |
| `RUDDERSTACK_TRACKED_PAGES` | Pages to auto-track (comma-separated) | ❌ | `/,/search,/[slug]` |

## 🎯 Usage

### Automatic Event Tracking

Add data attributes to any HTML element to enable automatic tracking:

```tsx
<button
  data-rudderstack-id="purchase-button"
  data-rudderstack-event="purchase_clicked"
  data-rudderstack-props={JSON.stringify({
    product_id: "123",
    category: "electronics",
    price: 99.99
  })}
>
  Buy Now
</button>
```

### Required Data Attributes

| Attribute | Description | Example |
|-----------|-------------|---------|
| `data-rudderstack-id` | Unique identifier for the element | `"nav-login-btn"` |
| `data-rudderstack-event` | Event name to track | `"login_clicked"` |
| `data-rudderstack-props` | Additional properties (JSON string) | `'{"source": "header"}'` |

### Using the Hook

```tsx
import { useRudderAnalytics } from "rudderstack-react-provider";

function MyComponent() {
  const { isInitialized } = useRudderAnalytics();

  if (!isInitialized) {
    return <div>Loading analytics...</div>;
  }

  return <div>Analytics ready!</div>;
}
```

## 📋 Examples

### E-commerce Button

```tsx
<button
  data-rudderstack-id="add-to-cart-btn"
  data-rudderstack-event="product_added_to_cart"
  data-rudderstack-props={JSON.stringify({
    product_id: product.id,
    product_name: product.name,
    category: product.category,
    price: product.price,
    quantity: 1,
    currency: "USD"
  })}
  onClick={addToCart}
>
  Add to Cart
</button>
```

### Navigation Link

```tsx
<Link
  href="/pricing"
  data-rudderstack-id="nav-pricing-link"
  data-rudderstack-event="navigation_clicked"
  data-rudderstack-props={JSON.stringify({
    destination: "/pricing",
    source: "main_nav"
  })}
>
  Pricing
</Link>
```

### Form Submission

```tsx
<form
  onSubmit={handleSubmit}
  data-rudderstack-id="contact-form"
  data-rudderstack-event="form_submitted"
  data-rudderstack-props={JSON.stringify({
    form_type: "contact",
    source: "footer"
  })}
>
  {/* form fields */}
  <button type="submit">Submit</button>
</form>
```

## 🔧 TypeScript Support

This package includes full TypeScript definitions:

```tsx
import { 
  RudderAnalyticsProvider, 
  useRudderAnalytics,
  RudderAnalyticsContextType 
} from "rudderstack-react-provider";
```

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

MIT © [Your Name](https://github.com/yourusername)

---

<div align="center">

**[⬆ Back to Top](#-rudderstack-react-provider)**

</div>