# Comprehensive Guide to Automating WordPress Plugins with Playwright

## 1. Overview of Playwright

Playwright is a modern, open-source browser automation framework developed by Microsoft that enables reliable end-to-end testing across all major browsers (Chromium, Firefox, and WebKit). In the context of WordPress plugin automation, Playwright offers several key capabilities:

**Core Capabilities:**
- **Cross-browser testing:** Test your plugin across Chrome, Firefox, and Safari with a single codebase
- **Reliable automation:** Playwright waits for elements to be actionable before performing actions, reducing flaky tests
- **Powerful selectors:** Support for CSS, XPath, text content, and custom selectors to interact with WordPress elements
- **Network interception:** Monitor and mock API calls, including WordPress REST API requests
- **Screenshot and video recording:** Capture visual evidence of plugin behavior for debugging
- **Parallel execution:** Run multiple tests simultaneously to speed up your test suite
- **Auto-waiting:** Automatically waits for elements to be ready, eliminating most timing issues

For WordPress plugins specifically, Playwright excels at simulating real user interactions with your admin interface, testing frontend functionality, and validating that your plugin integrates correctly with WordPress core and other plugins.

## 2. How Playwright Interacts with WordPress

Playwright interacts with WordPress through standard browser automation techniques, but several aspects make it particularly suitable for WordPress development:

**WordPress-Specific Interaction Patterns:**

WordPress uses consistent UI patterns that Playwright can reliably target. The admin interface includes predictable class names, IDs, and data attributes that your tests can leverage. For example, WordPress menu items use `.wp-menu-name`, settings fields often have descriptive IDs, and the admin bar has consistent selectors.

**Authentication Handling:**

Playwright can handle WordPress authentication in several ways. You can programmatically log in through the wp-login.php page, save authentication state for reuse across tests, or use WordPress's application passwords feature for API-based authentication.

**WordPress-Specific Considerations:**

WordPress's AJAX-heavy admin interface requires careful handling of dynamic content. Playwright's auto-waiting mechanisms handle most of these cases automatically, but you may need to wait for specific network requests to complete. The WordPress block editor (Gutenberg) presents unique challenges due to its React-based architecture and iframe structure, which Playwright handles through its frame selectors.

**REST API Integration:**

Playwright can interact with WordPress's REST API to set up test data, verify backend state, or perform actions that don't require UI interaction. This hybrid approach often leads to faster, more reliable tests.

## 3. Setting Up Playwright for WordPress Plugin Automation

### Step 1: Prerequisites

Ensure you have the following installed:
- Node.js (version 14 or higher)
- A local WordPress installation (using Local, XAMPP, Docker, or similar)
- Your WordPress plugin installed and activated

### Step 2: Initialize Your Project

Create a new directory for your tests and initialize a Node.js project:

```bash
mkdir my-plugin-tests
cd my-plugin-tests
npm init -y
```

### Step 3: Install Playwright

Install Playwright and its browsers:

```bash
npm init playwright@latest
```

This command will:
- Install Playwright and its dependencies
- Install browser binaries
- Create a `playwright.config.js` configuration file
- Add example tests and a GitHub Actions workflow

Alternatively, install manually:

```bash
npm install -D @playwright/test
npx playwright install
```

### Step 4: Configure Playwright for WordPress

Edit your `playwright.config.js` to optimize for WordPress testing:

```javascript
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  fullyParallel: false, // WordPress often requires sequential testing
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : 1, // Single worker for WordPress
  reporter: 'html',
  
  use: {
    baseURL: process.env.WP_BASE_URL || 'http://localhost:8888', // Your WordPress site URL
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
```

### Step 5: Create WordPress Utilities

Create a `utils/wordpress.js` file with helper functions:

```javascript
export async function loginToWordPress(page, username, password) {
  await page.goto('/wp-login.php');
  await page.fill('#user_login', username);
  await page.fill('#user_pass', password);
  await page.click('#wp-submit');
  await page.waitForURL(/wp-admin/);
}

export async function navigateToPlugin(page, pluginPath) {
  await page.goto(`/wp-admin/${pluginPath}`);
  await page.waitForLoadState('networkidle');
}

export async function savePostOrSettings(page) {
  await page.click('text=Save Changes, text=Publish, text=Update');
  await page.waitForSelector('.notice-success, .updated');
}
```

### Step 6: Set Up Authentication Storage

Create a setup script to save authentication state:

```javascript
// tests/setup/auth.setup.js
import { test as setup } from '@playwright/test';

const authFile = 'playwright/.auth/user.json';

setup('authenticate', async ({ page }) => {
  await page.goto('/wp-login.php');
  await page.fill('#user_login', process.env.WP_ADMIN_USER || 'admin');
  await page.fill('#user_pass', process.env.WP_ADMIN_PASSWORD || 'password');
  await page.click('#wp-submit');
  await page.waitForURL(/wp-admin/);
  
  await page.context().storageState({ path: authFile });
});
```

Update your config to use this authentication:

```javascript
export default defineConfig({
  // ... other config
  projects: [
    { name: 'setup', testMatch: /.*\.setup\.js/ },
    {
      name: 'chromium',
      use: { 
        ...devices['Desktop Chrome'],
        storageState: 'playwright/.auth/user.json',
      },
      dependencies: ['setup'],
    },
  ],
});
```

## 4. Common Automation Tasks with Examples

### Example 1: Testing Plugin Activation

```javascript
import { test, expect } from '@playwright/test';

test('activate and deactivate plugin', async ({ page }) => {
  await page.goto('/wp-admin/plugins.php');
  
  // Activate plugin
  const pluginRow = page.locator('tr', { 
    hasText: 'My Awesome Plugin' 
  });
  
  if (await pluginRow.locator('text=Activate').isVisible()) {
    await pluginRow.locator('text=Activate').click();
    await expect(page.locator('.notice-success')).toBeVisible();
    await expect(pluginRow.locator('text=Deactivate')).toBeVisible();
  }
});
```

### Example 2: Testing Plugin Settings

```javascript
test('save plugin settings', async ({ page }) => {
  await page.goto('/wp-admin/admin.php?page=my-plugin-settings');
  
  // Fill in settings
  await page.fill('#api_key', 'test-api-key-123');
  await page.check('#enable_feature');
  await page.selectOption('#mode', 'advanced');
  
  // Save settings
  await page.click('text=Save Changes');
  await expect(page.locator('.notice-success')).toContainText(
    'Settings saved'
  );
  
  // Verify settings persisted
  await page.reload();
  await expect(page.locator('#api_key')).toHaveValue('test-api-key-123');
  await expect(page.locator('#enable_feature')).toBeChecked();
});
```

### Example 3: Testing Frontend Functionality

```javascript
test('plugin shortcode renders correctly', async ({ page }) => {
  // Create a test post with the shortcode
  await page.goto('/wp-admin/post-new.php');
  
  await page.fill('#title', 'Test Post for Plugin');
  
  // Switch to text editor (if using classic editor)
  await page.click('.wp-switch-editor.switch-html');
  await page.fill('#content', '[my_plugin_shortcode]');
  
  // Publish
  await page.click('text=Publish');
  await page.click('.editor-post-publish-button');
  
  // View the post
  const viewLink = await page.locator('.post-publish-panel__postpublish-buttons a').first();
  await viewLink.click();
  
  // Verify shortcode output
  await expect(page.locator('.my-plugin-output')).toBeVisible();
  await expect(page.locator('.my-plugin-output')).toContainText(
    'Expected Content'
  );
});
```

### Example 4: Testing Block Editor (Gutenberg) Integration

```javascript
test('custom block works in editor', async ({ page }) => {
  await page.goto('/wp-admin/post-new.php');
  
  // Wait for editor to load
  await page.waitForSelector('.block-editor');
  
  // Click the block inserter
  await page.click('.edit-post-header-toolbar__inserter-toggle');
  
  // Search for your custom block
  await page.fill('.block-editor-inserter__search-input', 'My Custom Block');
  
  // Insert the block
  await page.click('button[aria-label*="My Custom Block"]');
  
  // Interact with block settings
  const block = page.locator('[data-type="my-plugin/custom-block"]').first();
  await block.click();
  
  // Update block attributes in sidebar
  await page.fill('.components-text-control__input >> nth=0', 'Test Value');
  
  // Verify block preview
  await expect(block).toContainText('Test Value');
});
```

### Example 5: Testing AJAX Functionality

```javascript
test('plugin AJAX handler works', async ({ page }) => {
  await page.goto('/wp-admin/admin.php?page=my-plugin');
  
  // Listen for AJAX requests
  const requestPromise = page.waitForRequest(
    request => request.url().includes('admin-ajax.php') &&
                request.postDataJSON()?.action === 'my_plugin_action'
  );
  
  // Trigger AJAX action
  await page.click('#trigger-ajax-button');
  
  const request = await requestPromise;
  expect(request.postDataJSON()).toMatchObject({
    action: 'my_plugin_action',
    nonce: expect.any(String),
  });
  
  // Wait for response and verify UI update
  await expect(page.locator('.ajax-result')).toContainText(
    'Success',
    { timeout: 5000 }
  );
});
```

### Example 6: Performance Validation

```javascript
test('plugin page loads within acceptable time', async ({ page }) => {
  const startTime = Date.now();
  
  await page.goto('/wp-admin/admin.php?page=my-plugin-dashboard');
  await page.waitForLoadState('networkidle');
  
  const loadTime = Date.now() - startTime;
  
  expect(loadTime).toBeLessThan(3000); // Page should load in under 3 seconds
  
  // Check for console errors
  const errors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') errors.push(msg.text());
  });
  
  expect(errors).toHaveLength(0);
});
```

### Example 7: Error Handling and Validation

```javascript
test('plugin handles invalid input gracefully', async ({ page }) => {
  await page.goto('/wp-admin/admin.php?page=my-plugin-settings');
  
  // Test invalid input
  await page.fill('#api_key', '<script>alert("xss")</script>');
  await page.click('text=Save Changes');
  
  // Verify error message is displayed
  await expect(page.locator('.error, .notice-error')).toBeVisible();
  await expect(page.locator('.error, .notice-error')).toContainText('Invalid input');
  
  // Verify input is sanitized
  await page.reload();
  await expect(page.locator('#api_key')).not.toHaveValue('<script>alert("xss")</script>');
});

test('API error responses are handled properly', async ({ request }) => {
  // Test invalid API request
  const response = await request.get('/wp-json/wp/v2/posts/999999');
  expect(response.status()).toBe(404);
  
  const errorData = await response.json();
  expect(errorData).toHaveProperty('code', 'rest_post_invalid_id');
});
```

### Example 8: Security Testing

```javascript
test('XSS protection in user inputs', async ({ page }) => {
  await page.goto('/wp-admin/post-new.php');
  
  // Attempt XSS in post title
  await page.fill('#title', '<script>alert("xss")</script>');
  await page.click('text=Publish');
  
  // View published post
  const viewLink = await page.locator('.post-publish-panel__postpublish-buttons a').first();
  await viewLink.click();
  
  // Verify XSS is sanitized
  const titleElement = page.locator('h1.entry-title');
  const titleText = await titleElement.innerHTML();
  expect(titleText).not.toContain('<script>');
});

test('unauthorized access is blocked', async ({ request }) => {
  // Test without authentication
  const response = await request.get('/wp-json/wp/v2/posts');
  expect(response.status()).toBe(200); // Public posts are accessible
  
  // Test admin-only endpoint
  const adminResponse = await request.get('/wp-json/wp/v2/users');
  expect(adminResponse.status()).toBe(401); // Should require authentication
});

test('nonce validation prevents CSRF', async ({ page }) => {
  await page.goto('/wp-admin/admin.php?page=my-plugin');
  
  // Get current nonce
  const nonce = await page.evaluate(() => wpApiSettings?.nonce);
  
  // Try request with invalid nonce
  const response = await page.request.post('/wp-admin/admin-ajax.php', {
    data: {
      action: 'my_plugin_action',
      _wpnonce: 'invalid_nonce_123',
    },
  });
  
  expect(response.status()).toBe(200); // Request goes through but action fails
  const result = await response.json();
  expect(result.success).toBe(false);
});
```

## 5. Official Resources and Documentation

### Playwright Resources

**Official Documentation:**
- Playwright documentation: https://playwright.dev
- API reference: https://playwright.dev/docs/api/class-playwright
- Best practices guide: https://playwright.dev/docs/best-practices

**WordPress-Specific Resources:**

While there isn't an official Playwright-WordPress integration library maintained by either project, the community has created several useful resources:

- **WordPress E2E Test Utils:** WordPress Core uses Playwright for its own end-to-end tests. You can find utilities in the Gutenberg repository that may be helpful
- **@wordpress/e2e-test-utils-playwright:** An official package from WordPress for Gutenberg testing that provides helper functions for common WordPress interactions
- **Community examples:** GitHub repositories containing WordPress plugin test examples using Playwright

**Installation of WordPress Test Utils:**

```bash
npm install -D @wordpress/e2e-test-utils-playwright
```

**Using WordPress Test Utils:**

```javascript
import { test, expect } from '@playwright/test';
import { Admin } from '@wordpress/e2e-test-utils-playwright';

test('use WordPress utils', async ({ page, admin }) => {
  await admin.visitAdminPage('plugins.php');
  await admin.createNewPost({ title: 'Test Post' });
});
```

### Additional Libraries

- **playwright-expect:** Enhanced assertions for Playwright
- **axe-playwright:** Accessibility testing integration
- **playwright-lighthouse:** Performance auditing
- **playwright-network-interceptor:** Advanced network request monitoring

## 6. Advanced Testing Strategies

### Accessibility Testing

WordPress plugins must be accessible. Use axe-playwright for automated accessibility testing:

```javascript
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test('plugin admin interface is accessible', async ({ page }) => {
  await page.goto('/wp-admin/admin.php?page=my-plugin');
  
  const accessibilityScanResults = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
    .analyze();
  
  expect(accessibilityScanResults.violations).toEqual([]);
});

test('plugin frontend is accessible', async ({ page }) => {
  await page.goto('/my-plugin-page');
  
  const results = await new AxeBuilder({ page }).analyze();
  
  // Allow some violations for legacy content but ensure no critical issues
  const criticalViolations = results.violations.filter(v => 
    v.impact === 'critical' || v.impact === 'serious'
  );
  
  expect(criticalViolations).toHaveLength(0);
});
```

### Mobile and Responsive Testing

Test your plugin across different screen sizes and devices:

```javascript
test.describe('Responsive Design Testing', () => {
  const viewports = [
    { name: 'Mobile', width: 375, height: 667 },
    { name: 'Tablet', width: 768, height: 1024 },
    { name: 'Desktop', width: 1920, height: 1080 },
  ];

  for (const viewport of viewports) {
    test(`plugin works on ${viewport.name}`, async ({ page }) => {
      await page.setViewportSize({ 
        width: viewport.width, 
        height: viewport.height 
      });
      
      await page.goto('/wp-admin/admin.php?page=my-plugin');
      
      // Test mobile-specific interactions
      if (viewport.width < 768) {
        // Test hamburger menu, touch interactions, etc.
        await expect(page.locator('.mobile-menu-toggle')).toBeVisible();
      }
      
      // Verify content is properly sized and readable
      await expect(page.locator('.plugin-content')).toBeVisible();
    });
  }
});
```

### User Role and Permissions Testing

Test your plugin with different WordPress user roles:

```javascript
const userRoles = ['administrator', 'editor', 'author', 'contributor', 'subscriber'];

for (const role of userRoles) {
  test.describe(`${role} role testing`, () => {
    test.beforeEach(async ({ page }) => {
      await loginAsRole(page, role);
    });

    test('plugin respects user capabilities', async ({ page }) => {
      await page.goto('/wp-admin/admin.php?page=my-plugin');
      
      if (role === 'administrator') {
        // Admin should see all settings
        await expect(page.locator('.admin-only-setting')).toBeVisible();
      } else {
        // Non-admin should not see restricted areas
        await expect(page.locator('.admin-only-setting')).not.toBeVisible();
        
        // Should see appropriate access denied message
        await expect(page.locator('.access-denied')).toBeVisible();
      }
    });
  });
}
```

### Data-Driven Testing

Use external data sources for comprehensive testing:

```javascript
// test-data/plugin-settings.json
[
  { "apiKey": "valid-key-123", "expected": "success" },
  { "apiKey": "", "expected": "error" },
  { "apiKey": "<script>alert('xss')</script>", "expected": "sanitized" }
]

// Test file
import testData from './test-data/plugin-settings.json';

test.describe('Plugin Settings Validation', () => {
  for (const data of testData) {
    test(`validates input: ${data.apiKey}`, async ({ page }) => {
      await page.goto('/wp-admin/admin.php?page=my-plugin-settings');
      await page.fill('#api_key', data.apiKey);
      await page.click('text=Save Changes');
      
      if (data.expected === 'success') {
        await expect(page.locator('.notice-success')).toBeVisible();
      } else if (data.expected === 'error') {
        await expect(page.locator('.notice-error')).toBeVisible();
      } else if (data.expected === 'sanitized') {
        await page.reload();
        await expect(page.locator('#api_key')).not.toHaveValue(data.apiKey);
      }
    });
  }
});
```

### Visual Regression Testing

Ensure UI changes don't break visual appearance:

```javascript
test('plugin UI has not changed visually', async ({ page }) => {
  await page.goto('/wp-admin/admin.php?page=my-plugin-dashboard');
  
  // Wait for dynamic content to load
  await page.waitForSelector('.dashboard-widget');
  
  // Take screenshot and compare
  await expect(page).toHaveScreenshot('plugin-dashboard.png', {
    threshold: 0.1, // Allow 10% difference
    fullPage: true
  });
});

test('responsive layout is consistent', async ({ page }) => {
  await page.setViewportSize({ width: 1200, height: 800 });
  await page.goto('/wp-admin/admin.php?page=my-plugin');
  
  await expect(page).toHaveScreenshot('plugin-desktop.png');
  
  // Test mobile layout
  await page.setViewportSize({ width: 375, height: 667 });
  await expect(page).toHaveScreenshot('plugin-mobile.png');
});
```

### Custom Post Types and Taxonomies Testing

Test plugin-specific content types:

```javascript
test('custom post type functionality', async ({ page }) => {
  // Test creating a custom post type
  await page.goto('/wp-admin/post-new.php?post_type=my_custom_type');
  
  await page.fill('#title', 'Test Custom Post');
  await page.fill('.wp-editor-area', 'Custom post content');
  
  // Fill custom fields
  await page.fill('#custom_field_1', 'Field Value');
  await page.selectOption('#custom_taxonomy', 'term-1');
  
  await page.click('text=Publish');
  await expect(page.locator('.notice-success')).toBeVisible();
  
  // Verify frontend display
  const viewLink = await page.locator('.post-publish-panel__postpublish-buttons a').first();
  await viewLink.click();
  
  await expect(page.locator('.custom-post-content')).toContainText('Custom post content');
  await expect(page.locator('.custom-field-display')).toContainText('Field Value');
});

test('custom taxonomy filtering', async ({ page }) => {
  await page.goto('/wp-admin/edit-tags.php?taxonomy=my_taxonomy&post_type=my_post_type');
  
  // Create taxonomy term
  await page.fill('#tag-name', 'Test Category');
  await page.fill('#tag-description', 'Test description');
  await page.click('text=Add New Category');
  
  await expect(page.locator('.notice-success')).toBeVisible();
  
  // Verify term appears in post editor
  await page.goto('/wp-admin/post-new.php?post_type=my_post_type');
  await expect(page.locator('#my_taxonomy option')).toContainText('Test Category');
});
```

### Plugin Update and Migration Testing

Test plugin updates and data migration:

```javascript
test.describe('Plugin Update Testing', () => {
  test('plugin updates without data loss', async ({ page }) => {
    // Install old version
    await installPluginVersion('my-plugin', '1.0.0');
    
    // Create test data
    await page.goto('/wp-admin/admin.php?page=my-plugin');
    await page.fill('#setting_1', 'Test Value');
    await page.click('text=Save Changes');
    
    // Update plugin
    await updatePlugin('my-plugin', '2.0.0');
    
    // Verify data migration
    await page.reload();
    await expect(page.locator('#setting_1')).toHaveValue('Test Value');
    
    // Verify new features work
    await expect(page.locator('.new-feature-v2')).toBeVisible();
  });
  
  test('database migration handles edge cases', async ({ page }) => {
    // Test migration with corrupted data
    await corruptTestData();
    await updatePlugin('my-plugin', '2.0.0');
    
    // Verify graceful handling
    await expect(page.locator('.migration-error')).toBeVisible();
    await expect(page.locator('.migration-error')).toContainText('Data migration completed with warnings');
  });
});
```

### Internationalization (i18n) Testing

Test plugin behavior with different languages:

```javascript
const locales = ['en_US', 'es_ES', 'fr_FR', 'de_DE'];

for (const locale of locales) {
  test(`plugin works with ${locale} locale`, async ({ page }) => {
    // Set WordPress locale
    await setWordPressLocale(locale);
    
    await page.goto('/wp-admin/admin.php?page=my-plugin');
    
    // Verify translated strings
    await expect(page.locator('text=Save Changes')).toBeVisible(); // Should be translated
    
    // Test date/number formatting
    await expect(page.locator('.formatted-date')).toMatch(/^\d{1,2}\/\d{1,2}\/\d{4}$/); // Locale-specific format
    
    // Test RTL languages if applicable
    if (['ar', 'he', 'fa'].some(lang => locale.startsWith(lang))) {
      await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
    }
  });
}
```

### CI/CD Integration

Integrate testing into your development workflow:

```yaml
# .github/workflows/plugin-tests.yml
name: Plugin Tests
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Setup WordPress
        run: |
          composer create-project roots/bedrock wordpress
          cd wordpress
          wp core install --url=http://localhost:8888 --title=Test --admin_user=admin --admin_password=password --admin_email=admin@test.com
          wp plugin install my-plugin --activate
      
      - name: Install Playwright
        run: npm ci && npx playwright install --with-deps
      
      - name: Run tests
        run: npm test
        env:
          WP_BASE_URL: http://localhost:8888
          WP_ADMIN_USER: admin
          WP_ADMIN_PASSWORD: password
      
      - name: Upload test results
        uses: actions/upload-artifact@v3
        if: always()
        with:
          name: test-results
          path: test-results/
```

### Load Testing Considerations

While Playwright is primarily for functional testing, you can simulate load:

```javascript
test.describe('Load Testing', () => {
  test('plugin handles multiple concurrent users', async ({ browser }) => {
    const users = 5;
    const pages = [];
    
    // Create multiple browser contexts
    for (let i = 0; i < users; i++) {
      const context = await browser.newContext();
      const page = await context.newPage();
      pages.push(page);
    }
    
    // Simulate concurrent actions
    const actions = pages.map(async (page, index) => {
      await page.goto('/wp-admin/admin.php?page=my-plugin');
      await page.fill('#user_action', `User ${index + 1}`);
      await page.click('text=Submit');
      await expect(page.locator('.success')).toBeVisible();
    });
    
    await Promise.all(actions);
    
    // Cleanup
    for (const page of pages) {
      await page.context().close();
    }
  });
});
```

### Writing Efficient Tests

**Use Proper Selectors:**

Prefer user-facing attributes over implementation details. WordPress provides good semantic HTML, so leverage it:

```javascript
// Good - resilient to changes
await page.click('text=Save Changes');
await page.locator('role=button[name="Publish"]').click();

// Less ideal - brittle
await page.click('#submit-button-123');
```

**Leverage Page Object Models:**

Organize your tests using the Page Object pattern for maintainability:

```javascript
// pages/PluginSettingsPage.js
export class PluginSettingsPage {
  constructor(page) {
    this.page = page;
    this.apiKeyInput = page.locator('#api_key');
    this.saveButton = page.locator('text=Save Changes');
  }
  
  async navigate() {
    await this.page.goto('/wp-admin/admin.php?page=my-plugin');
  }
  
  async setApiKey(key) {
    await this.apiKeyInput.fill(key);
  }
  
  async save() {
    await this.saveButton.click();
    await this.page.waitForSelector('.notice-success');
  }
}
```

**Manage Test Data Properly:**

Create and clean up test data to ensure test isolation:

```javascript
test.beforeEach(async ({ page }) => {
  // Create fresh test data
  await createTestPost(page);
});

test.afterEach(async ({ page }) => {
  // Clean up test data
  await deleteTestPost(page);
});
```

**Use API for Setup When Possible:**

Setting up data through the UI is slow. Use WordPress REST API for faster test setup:

```javascript
import { test, request } from '@playwright/test';

test.beforeEach(async () => {
  const apiContext = await request.newContext({
    baseURL: process.env.WP_BASE_URL || 'http://localhost:8888',
    extraHTTPHeaders: {
      'Authorization': 'Basic ' + Buffer.from(`${process.env.WP_ADMIN_USER || 'admin'}:${process.env.WP_ADMIN_PASSWORD || 'password'}`).toString('base64'),
    },
  });
  
  // Create post via API
  await apiContext.post('/wp-json/wp/v2/posts', {
    data: {
      title: 'Test Post',
      content: 'Test content',
      status: 'publish',
    },
  });
});
```

**Handle WordPress Nonces:**

WordPress uses nonces for security. Extract and use them properly:

```javascript
// Get nonce from page
const nonce = await page.evaluate(() => {
  return wpApiSettings.nonce;
});

// Use in API requests
await page.request.post('/wp-admin/admin-ajax.php', {
  data: {
    action: 'my_action',
    _wpnonce: nonce,
  },
});
```

### Security Testing Best Practices

**Test Input Validation:**
- Verify XSS prevention in all user inputs
- Test SQL injection attempts
- Validate file upload restrictions
- Check for command injection vulnerabilities

**Authentication & Authorization:**
- Test role-based access control
- Verify session management
- Check for authentication bypass attempts
- Validate password policies

**Data Protection:**
- Test data sanitization and escaping
- Verify sensitive data isn't exposed in responses
- Check for information disclosure vulnerabilities
- Validate encryption of sensitive data

**API Security:**
- Test rate limiting and DoS protection
- Verify proper error handling (no stack traces)
- Check for insecure direct object references
- Validate CORS configuration

### Performance Testing Strategies

**Load Time Monitoring:**
```javascript
test('measure and validate performance metrics', async ({ page }) => {
  const client = await page.context().newCDPSession(page);
  
  await client.send('Performance.enable');
  await page.goto('/wp-admin/admin.php?page=my-plugin');
  await page.waitForLoadState('networkidle');
  
  const metrics = await client.send('Performance.getMetrics');
  const loadTime = metrics.metrics.find(m => m.name === 'Timestamp');
  
  // Log performance metrics
  console.log('Page load metrics:', metrics);
  
  // Assert acceptable performance
  expect(loadTime.value).toBeLessThan(5.0); // Less than 5 seconds
});
```

**Memory Usage Tracking:**
```javascript
test('monitor memory usage', async ({ page }) => {
  const client = await page.context().newCDPSession(page);
  
  await client.send('HeapProfiler.enable');
  await page.goto('/wp-admin/admin.php?page=my-plugin');
  
  // Perform memory-intensive operations
  // ... test actions ...
  
  const heapStats = await client.send('HeapProfiler.getHeapStats');
  console.log('Heap usage:', heapStats);
  
  // Assert memory usage is reasonable
  expect(heapStats.totalSize).toBeLessThan(50 * 1024 * 1024); // Less than 50MB
});
```

**Database Query Performance:**
```javascript
test('monitor database queries', async ({ page }) => {
  // Enable query monitoring (requires custom plugin or WP_DEBUG)
  await page.addInitScript(() => {
    window.dbQueries = [];
    // Hook into WordPress database queries
  });
  
  await page.goto('/wp-admin/admin.php?page=my-plugin-dashboard');
  
  const queryCount = await page.evaluate(() => window.dbQueries.length);
  const slowQueries = await page.evaluate(() => 
    window.dbQueries.filter(q => q.time > 0.1) // Queries slower than 100ms
  );
  
  console.log(`Total queries: ${queryCount}, Slow queries: ${slowQueries.length}`);
  expect(slowQueries.length).toBeLessThan(5);
});
```

### Troubleshooting Common Issues

**Issue: Flaky Tests Due to Timing**

Solution: Use Playwright's built-in waiting mechanisms rather than arbitrary sleeps:

```javascript
// Bad
await page.click('#button');
await page.waitForTimeout(2000);

// Good
await page.click('#button');
await page.waitForSelector('.result', { state: 'visible' });
```

**Issue: Authentication Keeps Expiring**

Solution: Use storageState to persist authentication, or increase session timeout in WordPress:

```javascript
// In wp-config.php, increase session length
define('ADMIN_COOKIE_EXPIRATION', 60 * 60 * 24 * 7); // 7 days
```

**Issue: Tests Fail in Headless Mode**

Solution: Some WordPress themes or plugins behave differently in headless mode. Run in headed mode for debugging:

```bash
npx playwright test --headed
```

**Issue: WordPress Admin Bar Covers Elements**

Solution: Account for the admin bar offset or hide it:

```javascript
// Hide admin bar for tests
await page.addInitScript(() => {
  document.documentElement.style.setProperty('margin-top', '0', 'important');
});
```

**Issue: Network Requests Fail or Timeout**

Solution: Implement retry logic and proper error handling:

```javascript
test('handle network failures gracefully', async ({ page }) => {
  let retries = 3;
  while (retries > 0) {
    try {
      await page.goto('/wp-admin/admin.php?page=my-plugin', { 
        timeout: 30000,
        waitUntil: 'networkidle' 
      });
      break; // Success, exit retry loop
    } catch (error) {
      retries--;
      if (retries === 0) throw error;
      await page.waitForTimeout(1000); // Wait before retry
    }
  }
});
```

**Issue: AJAX Requests Don't Complete**

Solution: Wait for specific network responses:

```javascript
// Wait for specific AJAX call to complete
await page.waitForResponse(response => 
  response.url().includes('admin-ajax.php') && 
  response.request().postDataJSON()?.action === 'my_action'
);

// Or wait for all network activity to settle
await page.waitForLoadState('networkidle');
```

**Issue: Database State Interferes Between Tests**

Solution: Reset database state or use unique test data:

```javascript
// Use unique identifiers for test data
const testId = Date.now();
const testPostTitle = `Test Post ${testId}`;

test.afterEach(async ({ request }) => {
  // Clean up test data
  const posts = await request.get('/wp-json/wp/v2/posts', {
    params: { search: testPostTitle }
  });
  const postData = await posts.json();
  for (const post of postData) {
    await request.delete(`/wp-json/wp/v2/posts/${post.id}`);
  }
});
```

**Issue: Plugin Conflicts Cause Test Failures**

Solution: Create isolated test environments:

```javascript
// Test with only essential plugins active
test.describe('Isolated Plugin Testing', () => {
  test.beforeAll(async () => {
    await deactivateAllPluginsExcept(['my-plugin']);
  });
  
  test.afterAll(async () => {
    await restorePluginState();
  });
});
```

### Error Handling Patterns

**Implement Robust Error Detection:**

```javascript
// Global error monitoring
test.beforeEach(async ({ page }) => {
  const errors = [];
  
  // Capture JavaScript errors
  page.on('pageerror', error => {
    errors.push(`Page Error: ${error.message}`);
  });
  
  // Capture console errors
  page.on('console', msg => {
    if (msg.type() === 'error') {
      errors.push(`Console Error: ${msg.text()}`);
    }
  });
  
  // Capture failed network requests
  page.on('requestfailed', request => {
    errors.push(`Request Failed: ${request.url()} - ${request.failure()?.errorText}`);
  });
  
  // Store errors for later assertion
  page.errors = errors;
});

test.afterEach(async ({ page }) => {
  // Assert no errors occurred during test
  expect(page.errors).toHaveLength(0);
});
```

**Handle Expected Errors Gracefully:**

```javascript
test('validate error states are handled properly', async ({ page }) => {
  // Test invalid form submission
  await page.goto('/wp-admin/admin.php?page=my-plugin-settings');
  await page.fill('#email', 'invalid-email');
  await page.click('text=Save Changes');
  
  // Verify error is displayed
  await expect(page.locator('.error-message')).toBeVisible();
  await expect(page.locator('.error-message')).toContainText('Invalid email address');
  
  // Verify form is not submitted
  await expect(page.locator('.success-message')).not.toBeVisible();
});
```

**API Error Response Validation:**

```javascript
test('API returns proper error responses', async ({ request }) => {
  // Test various error scenarios
  const testCases = [
    { id: 999999, expectedStatus: 404, expectedCode: 'rest_post_invalid_id' },
    { id: 'invalid', expectedStatus: 404, expectedCode: 'rest_no_route' },
    { id: -1, expectedStatus: 404, expectedCode: 'rest_post_invalid_id' },
  ];
  
  for (const testCase of testCases) {
    const response = await request.get(`/wp-json/wp/v2/posts/${testCase.id}`);
    expect(response.status()).toBe(testCase.expectedStatus);
    
    const data = await response.json();
    expect(data.code).toBe(testCase.expectedCode);
  }
});
```

## 6. Test Organization and Reporting

### Test Suite Structure

Organize tests for maintainability and scalability:

```
tests/
├── setup/
│   └── auth.setup.js
├── admin/
│   ├── settings.spec.js
│   ├── dashboard.spec.js
│   └── user-management.spec.js
├── frontend/
│   ├── public-pages.spec.js
│   ├── forms.spec.js
│   └── responsive.spec.js
├── api/
│   ├── rest-api.spec.js
│   └── ajax.spec.js
├── security/
│   ├── authentication.spec.js
│   ├── authorization.spec.js
│   └── input-validation.spec.js
├── performance/
│   ├── load-times.spec.js
│   ├── memory-usage.spec.js
│   └── database-queries.spec.js
├── accessibility/
│   └── a11y.spec.js
├── integration/
│   ├── third-party-plugins.spec.js
│   └── theme-compatibility.spec.js
└── regression/
    └── critical-flows.spec.js
```

### Advanced Test Configuration

Use Playwright's configuration for complex scenarios:

```javascript
// playwright.config.js
export default defineConfig({
  testDir: './tests',
  fullyParallel: false,
  
  // Global setup and teardown
  globalSetup: require.resolve('./global-setup'),
  globalTeardown: require.resolve('./global-teardown'),
  
  // Test-specific configurations
  use: {
    baseURL: process.env.WP_BASE_URL,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    
    // Custom test metadata
    testIdAttribute: 'data-testid',
  },
  
  projects: [
    {
      name: 'chromium-admin',
      use: { 
        ...devices['Desktop Chrome'],
        storageState: 'playwright/.auth/admin.json'
      },
      testMatch: '**/*.admin.spec.js',
    },
    {
      name: 'chromium-frontend',
      use: { 
        ...devices['Desktop Chrome']
      },
      testMatch: '**/*.frontend.spec.js',
    },
    {
      name: 'accessibility',
      use: { 
        ...devices['Desktop Chrome']
      },
      testMatch: '**/*.a11y.spec.js',
      grep: /@accessibility/,
    },
    {
      name: 'performance',
      use: { 
        ...devices['Desktop Chrome']
      },
      testMatch: '**/*.performance.spec.js',
      grep: /@performance/,
    },
  ],
  
  // Custom reporters
  reporter: [
    ['html', { outputFolder: 'playwright-report' }],
    ['json', { outputFile: 'test-results.json' }],
    ['junit', { outputFile: 'test-results.xml' }],
    ['github'], // For GitHub Actions
  ],
});
```

### Test Tagging and Filtering

Use tags for flexible test execution:

```javascript
test('admin settings @smoke @admin @settings', async ({ page }) => {
  // Critical admin functionality
});

test('user registration @regression @frontend @auth', async ({ page }) => {
  // User-facing feature
});

test('accessibility compliance @accessibility @compliance', async ({ page }) => {
  // WCAG compliance testing
});

test('performance benchmark @performance @benchmark', async ({ page }) => {
  // Performance testing
});
```

Run specific test groups:

```bash
# Run only smoke tests
npm run test -- --grep "@smoke"

# Run admin tests only
npm run test -- --project=chromium-admin

# Run accessibility tests
npm run test -- --grep "@accessibility"

# Run tests excluding performance tests
npm run test -- --grep-invert "@performance"
```

### Custom Reporting and Analytics

Create custom reporters for detailed insights:

```javascript
// custom-reporter.js
class CustomReporter {
  onTestEnd(test, result) {
    // Log test metadata
    console.log(`Test: ${test.title}`);
    console.log(`Duration: ${result.duration}ms`);
    console.log(`Status: ${result.status}`);
    
    // Track performance metrics
    if (test.tags?.includes('@performance')) {
      // Store performance data
      this.savePerformanceMetric(test.title, result.duration);
    }
    
    // Track accessibility violations
    if (test.tags?.includes('@accessibility')) {
      // Analyze accessibility results
      this.analyzeAccessibilityResults(result);
    }
  }
  
  savePerformanceMetric(testName, duration) {
    // Save to database or file
  }
  
  analyzeAccessibilityResults(result) {
    // Parse and analyze accessibility violations
  }
}

export default CustomReporter;
```

## 7. WordPress-Specific Best Practices

### Plugin Lifecycle Testing

Test the complete plugin lifecycle:

```javascript
test.describe('Plugin Lifecycle', () => {
  test('fresh installation', async ({ page }) => {
    await installPluginFresh('my-plugin.zip');
    await page.goto('/wp-admin/plugins.php');
    
    // Verify activation link is present
    await expect(page.locator('text=Activate')).toBeVisible();
    
    // Activate and verify
    await page.click('text=Activate');
    await expect(page.locator('.notice-success')).toBeVisible();
    
    // Check database tables created
    const tables = await getDatabaseTables();
    expect(tables).toContain('wp_my_plugin_data');
  });
  
  test('plugin deactivation and reactivation', async ({ page }) => {
    // Deactivate
    await page.goto('/wp-admin/plugins.php');
    await page.click('text=Deactivate');
    await expect(page.locator('.notice-success')).toBeVisible();
    
    // Verify cleanup (optional data retention)
    const options = await getPluginOptions();
    expect(options).toContain('my_plugin_settings'); // Settings retained
    
    // Reactivate
    await page.click('text=Activate');
    await expect(page.locator('.notice-success')).toBeVisible();
  });
  
  test('plugin uninstallation', async ({ page }) => {
    await page.goto('/wp-admin/plugins.php');
    
    // Click delete link
    await page.click('text=Delete');
    await page.click('text=Yes, delete these files');
    
    // Verify complete removal
    await expect(page.locator('text=My Plugin')).not.toBeVisible();
    
    // Check database cleanup
    const tables = await getDatabaseTables();
    expect(tables).not.toContain('wp_my_plugin_data');
  });
});
```

### WordPress Coding Standards Integration

Integrate with WordPress coding standards:

```javascript
// Test PHP code quality
test('PHP code follows WordPress standards', async () => {
  const { exec } = require('child_process');
  const { promisify } = require('util');
  const execAsync = promisify(exec);
  
  try {
    const { stdout } = await execAsync('phpcs --standard=WordPress wp-content/plugins/my-plugin/');
    console.log('PHPCS Results:', stdout);
    
    // Parse results and assert no errors
    const errors = parsePHPCSOutput(stdout);
    expect(errors).toHaveLength(0);
  } catch (error) {
    console.log('PHPCS failed:', error.message);
    // Handle expected failures or assert specific error counts
  }
});

// Test JavaScript code quality
test('JavaScript code follows standards', async () => {
  const { exec } = require('child_process');
  const { promisify } = require('util');
  const execAsync = promisify(exec);
  
  const { stdout } = await execAsync('eslint wp-content/plugins/my-plugin/assets/js/');
  const errors = parseEslintOutput(stdout);
  expect(errors).toHaveLength(0);
});
```

### Dependency Management Testing

Test with different versions of dependencies:

```javascript
const wordpressVersions = ['6.0', '6.1', '6.2', '6.3', '6.4'];
const phpVersions = ['7.4', '8.0', '8.1', '8.2'];

for (const wpVersion of wordpressVersions) {
  for (const phpVersion of phpVersions) {
    test(`plugin works with WordPress ${wpVersion} and PHP ${phpVersion}`, async () => {
      // Setup test environment with specific versions
      await setupWordPressEnvironment(wpVersion, phpVersion);
      await installPlugin('my-plugin');
      
      // Run basic functionality tests
      await runBasicPluginTests();
      
      // Verify no PHP errors
      const errorLog = await getPHPErrorLog();
      expect(errorLog).not.toMatch(/Fatal error|Parse error|Warning/);
    });
  }
}
```

### Backup and Recovery Testing

Ensure plugin data can be safely backed up and restored:

```javascript
test('plugin data backup and restore', async ({ page }) => {
  // Create test data
  await page.goto('/wp-admin/admin.php?page=my-plugin');
  await page.fill('#important_setting', 'Critical Data');
  await page.click('text=Save Changes');
  
  // Export/backup data
  await page.click('text=Export Data');
  const download = await page.waitForEvent('download');
  const backupFile = await download.path();
  
  // Simulate data loss
  await deletePluginData();
  
  // Restore from backup
  await page.click('text=Import Data');
  await page.setInputFiles('#backup_file', backupFile);
  await page.click('text=Restore');
  
  // Verify data restoration
  await page.reload();
  await expect(page.locator('#important_setting')).toHaveValue('Critical Data');
});
```

## 8. Best Practices

### Known Limitations

**Complex Block Editor Interactions:**

The WordPress block editor (Gutenberg) uses React and can be challenging to test due to its dynamic nature and nested iframe structure. Some complex block interactions may require waiting for multiple renders or using custom selectors.

**Workaround:** Use the WordPress e2e-test-utils-playwright package which provides helpers specifically designed for Gutenberg interactions.

**WordPress Updates May Break Tests:**

WordPress frequently updates its admin interface, which can break tests that rely on specific selectors or UI structures.

**Workaround:** Use semantic selectors (roles, labels, text content) rather than CSS classes or IDs when possible. Regularly update your test suite when upgrading WordPress.

**Plugin Conflicts:**

When testing in an environment with multiple plugins, conflicts can occur that affect test reliability.

**Workaround:** Test in isolation with only your plugin active when possible, or create a dedicated testing WordPress installation with a minimal plugin set.

**Caching Issues:**

WordPress caching plugins and object caching can interfere with test expectations, causing tests to see stale data.

**Workaround:** Disable caching in your test environment, or explicitly clear caches between tests:

```javascript
// Clear object cache via WP-CLI
import { exec } from 'child_process';

test.beforeEach(async () => {
  exec('wp cache flush --path=/path/to/wordpress');
});
```

**Database State Management:**

WordPress stores data in a database, making test isolation challenging. Tests may interfere with each other if not properly isolated.

**Workaround:** Use transactions or database snapshots to reset state between tests, or use the WordPress REST API to clean up test data. Consider using a tool like WP-CLI to reset the database:

```bash
wp db reset --yes
wp db import test-database.sql
```

**Multisite Complexity:**

Testing multisite WordPress installations adds complexity due to network admin functionality and site-switching requirements.

**Workaround:** Create dedicated helper functions for multisite operations and carefully manage which site context your tests operate in.

**Security Testing Limitations:**

**CAPTCHA and Rate Limiting:** Automated tests may be blocked by CAPTCHA systems or rate limiting, making it difficult to test authentication flows extensively.

**Workaround:** Disable CAPTCHA in test environments, or use API-based authentication that bypasses these protections.

**Session Management:** WordPress session handling can be complex, especially with custom authentication plugins.

**Workaround:** Use application passwords or API keys for testing, and focus on testing session validation rather than session creation.

**File Upload Security:** Testing file upload vulnerabilities requires careful handling to avoid accidentally uploading malicious files to production systems.

**Workaround:** Use isolated test environments with proper cleanup, and test file validation logic rather than attempting actual exploits.

**Performance Testing Limitations:**

**Browser-Specific Performance:** Performance characteristics differ between browsers and headless vs headed modes.

**Workaround:** Run performance tests in the target browser environment, and consider both headed and headless results.

**Database Performance:** WordPress database queries can vary significantly based on data size and server configuration.

**Workaround:** Use realistic test data sizes, and consider database profiling tools to identify performance bottlenecks.

**Network Variability:** Test environment network conditions may not reflect production scenarios.

**Workaround:** Use network throttling to simulate various connection speeds, and consider external performance monitoring tools.

### Performance Considerations

Playwright tests against WordPress can be slow due to WordPress's processing time and the need for database operations. To improve performance, consider running tests in parallel when possible, using the API for setup/teardown instead of UI interactions, caching authentication state, and using a lightweight WordPress installation for testing (minimal themes and plugins).

---

This guide provides a solid foundation for automating WordPress plugin testing with Playwright. As you gain experience, you'll develop patterns and utilities specific to your plugin's needs. The key is to start with simple tests and gradually expand coverage as you become more comfortable with the tooling.