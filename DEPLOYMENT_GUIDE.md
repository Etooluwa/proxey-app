# Deployment Guide for Proxey App

## Overview
Your app consists of:
- **Frontend**: React app (already deployed on Vercel)
- **Backend**: Node.js/Express API (needs to be deployed)

## Backend Deployment (Render.com)

### Step 1: Push Your Code to GitHub
```bash
git add .
git commit -m "Add: Backend deployment configuration"
git push origin feature/prototype-migration
```

### Step 2: Deploy to Render

1. Go to [render.com](https://render.com) and sign up/login
2. Click "New +" → "Web Service"
3. Connect your GitHub repository
4. Render will auto-detect the `render.yaml` file
5. Add environment variables:
   - `SUPABASE_URL` - Your Supabase project URL
   - `SUPABASE_ANON_KEY` - Your Supabase anon key
   - `SUPABASE_SERVICE_ROLE_KEY` - Your Supabase service role key
   - `STRIPE_SECRET_KEY` - Your Stripe secret key
   - `STRIPE_WEBHOOK_SECRET` - Your Stripe webhook secret
6. Click "Create Web Service"

### Step 3: Get Your API URL
Once deployed, Render will give you a URL like:
- `https://proxey-api.onrender.com`

### Step 4: Update Frontend Environment Variable in Vercel

1. Go to your Vercel project settings
2. Navigate to "Environment Variables"
3. Add/Update:
   - `REACT_APP_API_BASE` = `https://proxey-api.onrender.com/api`
4. Redeploy your frontend

## Alternative: Deploy Backend to Railway

### Step 1: Push Code to GitHub (same as above)

### Step 2: Deploy to Railway

1. Go to [railway.app](https://railway.app) and sign up/login
2. Click "New Project" → "Deploy from GitHub repo"
3. Select your repository
4. Set root directory to `/server`
5. Add environment variables (same as Render)
6. Deploy!

### Step 3: Get Your API URL
Railway will give you a URL like:
- `https://proxey-api-production.up.railway.app`

### Step 4: Update Frontend (same as Render Step 4)

## Testing Your Deployed App

1. Open your Vercel URL: `https://proxey-app-git-feature-prototype-migration-eto-seguns-projects.vercel.app`
2. Navigate to the client dashboard
3. Click on a provider profile under "Popular Professionals"
4. You should see the provider's profile instead of "Provider not found"!

## Important Notes

### Free Tier Limitations

**Render (Free)**:
- Goes to sleep after 15 minutes of inactivity
- First request after sleep takes ~30 seconds
- 750 hours/month free

**Railway (Free)**:
- $5 free credits per month
- ~500 hours of runtime

**Recommendation**: For production, upgrade to paid tier for better performance.

### Environment Variables Checklist

Make sure these are set in your backend deployment:

- ✅ `SUPABASE_URL`
- ✅ `SUPABASE_ANON_KEY`
- ✅ `SUPABASE_SERVICE_ROLE_KEY`
- ✅ `STRIPE_SECRET_KEY`
- ✅ `STRIPE_WEBHOOK_SECRET`
- ✅ `NODE_ENV=production`

### CORS Configuration

Your backend now allows:
- `http://localhost:3000` (for local development)
- `https://proxey-app-git-feature-prototype-migration-eto-seguns-projects.vercel.app`
- `https://proxey-app.vercel.app`
- All `*.vercel.app` domains (for preview deployments)

If you get CORS errors, check that your Vercel domain is in the allowed origins list in `server/server.js`.

## Updating the Deployed App

### Backend Updates
```bash
git add server/
git commit -m "Update: Backend changes"
git push
```
Render/Railway will auto-deploy.

### Frontend Updates
```bash
git add client/
git commit -m "Update: Frontend changes"
git push
```
Vercel will auto-deploy.

## Troubleshooting

### Issue: "Provider not found" still shows

**Solution**: Check browser console for errors. Make sure:
1. Backend is deployed and running
2. `REACT_APP_API_BASE` in Vercel points to your deployed backend
3. Frontend has been redeployed after updating env vars

### Issue: CORS errors

**Solution**:
1. Check that your Vercel URL is in the `allowedOrigins` array in `server/server.js`
2. Make sure `credentials: true` is set in CORS config
3. Redeploy backend after changes

### Issue: Backend is slow on first request

**Solution**: This is normal for Render free tier. The service goes to sleep after 15 minutes of inactivity. Consider:
1. Using a paid tier for production
2. Setting up a cron job to ping your API every 10 minutes
3. Using Railway instead (less sleep issues on free tier)

## Custom Domain (Optional)

### Frontend (Vercel)
1. Go to Vercel project settings → Domains
2. Add your custom domain (e.g., `proxey.com`)
3. Update DNS records as instructed

### Backend (Render)
1. Go to your service settings → Custom Domain
2. Add your custom domain (e.g., `api.proxey.com`)
3. Update DNS records as instructed
4. Update `REACT_APP_API_BASE` in Vercel to use new domain

## Next Steps

After deployment:
1. Test all features end-to-end
2. Monitor error logs in Render/Railway dashboard
3. Set up error tracking (e.g., Sentry)
4. Configure production Stripe webhooks to point to your deployed backend
