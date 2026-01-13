# Deployment Guide - Carinski Alat

## Cloudflare Pages Deployment

### Prerequisites
- Cloudflare account
- GitHub repository with your code
- Node.js 18+ installed locally

### Method 1: Cloudflare Dashboard (Recommended)

1. **Connect GitHub Repository**
   - Go to [Cloudflare Dashboard](https://dash.cloudflare.com/)
   - Navigate to "Workers & Pages"
   - Click "Create application" → "Pages" → "Connect to Git"
   - Select your GitHub account and repository `all-for-customs`
   - Click "Begin setup"

2. **Configure Build Settings**
   ```
   Framework preset: Vite
   Build command: npm run build
   Build output directory: dist
   Root directory: /
   Node version: 18 or higher
   ```

3. **Environment Variables**
   Add in Cloudflare dashboard under "Settings" → "Environment Variables":
   ```
   OPENAI_API_KEY = your_openai_api_key
   ```

4. **Deploy**
   - Click "Save and Deploy"
   - Wait for build to complete
   - Your site will be live at `https://all-for-customs.pages.dev`

5. **Custom Domain (Optional)**
   - Go to "Custom domains"
   - Add your domain
   - Follow DNS instructions

### Method 2: Wrangler CLI

1. **Install Wrangler**
   ```bash
   npm install -g wrangler
   ```

2. **Login to Cloudflare**
   ```bash
   wrangler login
   ```

3. **Build Your Project**
   ```bash
   npm run build
   ```

4. **Deploy**
   ```bash
   wrangler pages deploy dist --project-name=all-for-customs
   ```

5. **Set Environment Variables**
   ```bash
   wrangler pages secret put OPENAI_API_KEY
   # Enter your API key when prompted
   ```

### Method 3: GitHub Actions (CI/CD)

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Cloudflare Pages

on:
  push:
    branches:
      - main
  workflow_dispatch:

jobs:
  deploy:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      deployments: write
    
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Build
        run: npm run build
        env:
               OPENAI_API_KEY: ${{ secrets.OPENAI_API_KEY }}

      - name: Deploy to Cloudflare Pages
        uses: cloudflare/pages-action@v1
        with:
          apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          accountId: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
          projectName: all-for-customs
          directory: dist
          gitHubToken: ${{ secrets.GITHUB_TOKEN }}
```

**Required GitHub Secrets:**
- `CLOUDFLARE_API_TOKEN` - From Cloudflare dashboard
- `CLOUDFLARE_ACCOUNT_ID` - From Cloudflare dashboard
- `OPENAI_API_KEY` - Your OpenAI API key (server-side; do not use VITE_ prefix)

### Post-Deployment Checklist

- [ ] Test all language options
- [ ] Verify script conversion (Latin/Cyrillic)
- [ ] Test document upload functionality
- [ ] Check batch processing
- [ ] Verify Excel export/import
- [ ] Test classification accuracy
- [ ] Check mobile responsiveness
- [ ] Verify all navigation links
- [ ] Test favorites functionality
- [ ] Check history export

### Monitoring

1. **Cloudflare Analytics**
   - Dashboard → Pages → Your Project → Analytics
   - Monitor traffic, performance, errors

2. **Error Tracking**
   - Check build logs in Cloudflare dashboard
   - Monitor browser console in production

3. **Performance**
   - Use Cloudflare's built-in performance analytics
   - Monitor Web Vitals

### Troubleshooting

**Build Fails:**
- Check Node.js version (must be 18+)
- Verify all dependencies in package.json
- Check environment variables are set

**Runtime Errors:**
- Check browser console for errors
- Verify API keys are correctly set
- Check CORS settings if using external APIs

**Slow Performance:**
- Enable Cloudflare caching
- Optimize images and assets
- Consider enabling Cloudflare's speed features

### Rollback

If deployment has issues:

1. **Via Dashboard:**
   - Go to Deployments
   - Find previous working deployment
   - Click "Rollback to this deployment"

2. **Via CLI:**
   ```bash
   wrangler pages deployment list
   wrangler pages deployment rollback <DEPLOYMENT_ID>
   ```

### Custom Domain Setup

This project is intended to run on **www.carinski-asistent.com** (Cloudflare).

1. **Cloudflare Pages → Custom domains**
   - Add: `www.carinski-asistent.com`
   - Set it as the **Primary domain** (recommended)

2. **Cloudflare DNS records** (Zone: `carinski-asistent.com`)
   - `CNAME` record:
     - **Name:** `www`
     - **Target:** `all-for-customs.pages.dev` (or your actual Pages project hostname)
     - **Proxy:** Enabled (orange cloud)
   - Optional (recommended): ensure apex `carinski-asistent.com` also resolves:
     - Use a redirect rule (below), or add the apex domain in Pages custom domains.

3. **Redirect apex → www** (recommended)
   - Cloudflare → **Rules → Redirect Rules**
   - Create a 301 redirect:
     - **If:** Hostname equals `carinski-asistent.com`
     - **Then:** Redirect to `https://www.carinski-asistent.com/$1`
     - Enable “Preserve query string”

4. **Production environment variables (Cloudflare Pages)**
   Set these under Pages → Settings → Environment variables (Production):
   - `OPENAI_API_KEY` (secret)
   - `VITE_CONVEX_URL` (or `CONVEX_URL`) = `https://<your-deployment>.convex.cloud`

5. **Propagation & TLS**
   - DNS propagation can take time (usually minutes, up to 24–48h worst-case).
   - SSL/TLS certificates are issued automatically by Cloudflare.

### Production Environment Variables

```bash
# Required
OPENAI_API_KEY=sk-...

# Optional (for future features)
VITE_SENTRY_DSN=...           # Error tracking
VITE_GA_TRACKING_ID=...       # Analytics
VITE_API_BASE_URL=...         # If using custom API
```

### Continuous Deployment

Once set up with GitHub:
1. Push to main branch
2. Cloudflare automatically builds and deploys
3. Check deployment status in dashboard
4. Live in ~2-3 minutes

### Security Best Practices

1. **Never commit API keys** - Use environment variables
2. **Never expose secrets to the browser** - Avoid `VITE_*` for secrets (Vite injects them into client bundles)
2. **Enable Cloudflare Security** - WAF, DDoS protection
3. **Use HTTPS only** - Automatic with Cloudflare
4. **Implement rate limiting** - Cloudflare Workers
5. **Regular updates** - Keep dependencies updated

### Support

- Cloudflare Docs: https://developers.cloudflare.com/pages/
- Cloudflare Community: https://community.cloudflare.com/
- Wrangler Docs: https://developers.cloudflare.com/workers/wrangler/
