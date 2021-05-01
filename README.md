# PostScript Medical Annotation App

## Project installation and setup

Install Netlify's CLI globally:

```bash
npm install netlify-cli -g
```

Install Stipe's CLI globally (for MacOS):

```bash
brew install stripe/stripe-cli/stripe
```

> For further options and documentation [see Stripe's CLI documentation](https://stripe.com/docs/stripe-cli).

After that install the project's dependencies:

```bash
npm install
```

Link the cloned repository to the Netlify ID:

```bash
netlify link
```

Login with the project's Stripe account:

```bash
stripe login
```

## Running locally

Use the following command to start the local development server using Netlify's CLI so we can have access to Netlify's functions in the localhost environment.

```bash
netlify dev
```

Svelte will be running on `localhost:5000`.

And Netlify will run a server on `localhost:8888`.

Point your browser to Netlify's server to check your work as you develop.

### Testing Stripe's webhooks

Use Stripe's CLI to listen and forward events to the localhost environment:

```bash
stripe listen --forward-to http://localhost:8888/.netlify/functions/[netlify-function-name]
```

The command above will list a test webhook secret:

```bash
> Ready! Your webhook signing secret is [TEST_WEBHOOK_SECRET] (^C to quit)
```

Copy this secret and add it to a `.env` file at the root of the project alongside `package.json`. Double check this `.env` file is included in the `.gitignore` as it is not meant to be included in the repository.

You can trigger a local event using a second terminal a the following command:

```bash
stripe trigger checkout.session.completed
```
