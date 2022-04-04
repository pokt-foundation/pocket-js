# PocketJS

![Build](https://github.com/pokt-foundation/pocket-js-slim/actions/workflows/node.js.yml/badge.svg)

A complete, fast and slim SDK to interact with the Pocket Network.

## Usage

Add the packages for each part to your project:

```console
yarn add @pokt-foundation/pocketjs-provider @pokt-foundation/pocketjs-signer @pokt-foundation/pocketjs-relayer @pokt-foundation/pocketjs-utils
```

And use each piece as you see fit:

```javascript
import { JsonRpcProvider } from "@pokt-foundation/pocketjs-provider";
import { KeyManager } from "@pokt-foundation/pocketjs-signer";
import { Relayer } from "@pokt-foundation/pocketjs-relayer";
import {
  MAINNET_RPC_URL,
  DISPATCHERS,
  RELAY_DATA,
  POCKET_AAT,
} from "./config.js";

// Instanciate a provider for querying information on the chain!
export const provider = new JsonRpcProvider({
  rpcUrl: MAINNET_RPC_URL,
  // If you'll instanciate a relayer, you need to add dispatchers as well
  dispatchers: DISPATCHERS,
});

const balance = await provider.getBalance(
  "07a6fca4dea9f01e4c19f301df0d0afac128561b"
);

// Instanciate a signer for importing an account and signing messages!
export const signer = await KeyManager.fromPrivateKey(process.env.PRIVATE_KEY);

const address = signer.getAddress();
const publicKey = signer.getPublicKey();
const signedMessage = signer.sign("deadbeef");

export const relayer = new Relayer({
  keyManager: signer,
  provider,
  dispatchers: DISPATCHERS,
});

const session = await relayer.getNewSession({
  chain: process.env.APP_CHAIN,
  applicationPubKey: process.env.APP_PUBLIC_KEY,
});

const relay = await relayer.relay({
  data: process.env.RELAY_DATA,
  blockchain: process.env.APP_CHAIN,
  pocketAAT: POCKET_AAT,
  session: session,
});
```

## Contributing

#### 👋 Get started contributing with a [good first issue](https://github.com/pokt-foundation/pocket-js-slim/issues?q=is%3Aissue+is%3Aopen+label%3A%22good+first+issue%22).

Don't be shy to contribute even the smallest tweak. 🐲 There are still some dragons to be aware of, but we'll be here to help you get started!

## Issues

If you ever come across an issue with PocketJS, do a search in the issues tab of this repo and make sure it hasn't been reported before. Follow these steps to help us prevent unnecessary notifications to the many people following this repo.

- If the issue you found has been reported and is still open, and the details match your issue, give a "thumbs up" to the relevant posts in the issue thread to signal that you have the same issue. No further action is required on your part.
- If the issue you found has been reported and is still open, but the issue is missing some details, you can add a comment to the issue thread describing the additional details.
- If the issue you found has been reported but has been closed, you can comment on the closed issue thread and ask to have the issue reopened because you are still experiencing the issue. Alternatively, you can open a new issue, reference the closed issue by number or link, and state that you are still experiencing the issue. Provide any additional details in your post so we can better understand the issue and how to fix it.
