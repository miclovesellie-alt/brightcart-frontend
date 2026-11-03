# Shoppercart Storefront

React and Vite storefront with a role-gated admin area, customer accounts, checkout, and an integrated dropshipping workspace.

## Run locally

1. Start the [Shoppercart backend API](https://github.com/miclovesellie-alt/brightcart-backend) and configure its `.env` file.
2. Copy `.env.example` to `.env`. Local development defaults to `http://localhost:5000/api`; production defaults to `https://shoppercart-api.onrender.com/api`. Set `VITE_API_URL` to override either value.
3. Optionally set the Paystack **public** key from your own Paystack account. Leave it blank to disable Paystack checkout; never put a Paystack secret key in a `VITE_` variable.
4. Install dependencies and run Vite:

   ```sh
   npm install
   npm run dev
   ```

## Accounts and sessions

Registration and login are handled by the backend. New registrations receive the customer role; the first super admin is configured through the backend's `SUPER_ADMIN_EMAIL` and `SUPER_ADMIN_PASSWORD`, and that account manages other admin users. The frontend stores only the short-lived JWT session in `sessionStorage`, not the password, and sends it as a bearer token to protected API routes. See the backend README for hash, token, role, and lockout details.

## Dropshipping workspace

Admins can record sourced product research, use the pricing calculator, create hidden product drafts in the same catalog as Admin Products, review and publish them, and track fulfillment. The optional AI writer uses a locally installed Ollama model configured on the backend; there is no paid AI fallback. No supplier API or automatic purchasing integration is present. Paystack browser callbacks remain pending until a super admin manually verifies the transaction against Paystack. The app does not claim server-side payment verification.
