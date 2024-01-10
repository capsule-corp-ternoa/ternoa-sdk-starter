# 💡 Ternoa SDK Starter

***Welcome 👋,*** 

This tutorial provides an interactive approach to quickly dive into the Ternoa SDK and commence your journey of building on the blockchain. By completing the three fundamental exercises, you will acquire the skills to **mint, retrieve and sell an NFT** using our tools:

- **Ternoa-js API**: _A Javascript tool_, built on the Polkadot.js API, available as an [npm package](https://www.npmjs.com/package/ternoa-js). It streamlines the execution of transactions (referred to as extrinsics in the Polkadot/Substrate ecosystem) on the Ternoa chain, simplifying the process for developers. For more detailed information, please refer to our [documentation](https://github.com/capsule-corp-ternoa/ternoa-js).

- **Ternoa Indexer**: Our indexer serves as a comprehensive record of Ternoa Chain data, which you can seamlessly integrate into your codebase or experiment with in a [playground](https://indexer-mainnet.ternoa.dev/) environment.

Please note that this tutorial assumes a basic understanding of JavaScript and Node.js to grasp the fundamental concepts. If you are seeking detailed documentation, kindly visit the [Ternoa Documentation](https://docs.ternoa.network/).

## Prerequisites

Before getting started, please ensure that you have the following prerequisites in place:

1. Create a [Ternoa account](https://docs.ternoa.network/for-developers/get-started/create-account) with [Alphanet CAPS](https://docs.ternoa.network/for-developers/get-started/create-account#step-2-get-some-free-test-caps-tokens) from the faucet.
2. Install and configure your preferred code editor (for this tutorial, we will be using Visual Studio Code [VSC]).
3. Install [NodeJS v.14+](https://nodejs.org/en/download/), along with NPM.
4. Generate an IPFS Key from the [Ternoa IPFS Key manager](https://ipfs-key-manager-git-dev-ternoa.vercel.app/)

**Warning:** We assume you have already created a new wallet for development purposes with no CAPS on Ternoa Mainnet. It is essential you use a development wallet with NO REAL MONEY in it when learning, practicing, and testing.

## Getting Started

We already installed the Ternoa-JS, you can directly run the following command:

```bash showLineNumbers
  npm install
```

In the `.env.exemple` file, you will find the expected environement variables. Copy and paste them into a `.env` file at the root of the project.

- `SEED_TEST_FUNDS`: Your [Ternoa account](https://docs.ternoa.network/for-developers/get-started/create-account) _seed_ you will use to sign transactions.
- `IPFS_API_KEY`: An IPFS KEY generated with the Ternoa [IPFS Key manager](https://ipfs-key-manager-git-dev-ternoa.vercel.app/).

In the `src/basics/` folder we will find the following files:

- `01_mintNFT.ts`: In this 1st step, you will understand how to initialize the API and run your first on-chain transaction to create an NFT. Keep the NFT id from the log with you as you will need it later.

- `02_getNFT.ts`: In the 2nd step, you will see how to use our Indexer to retrieve your NFT data.

- `03_sellNFT.ts`: In the 3rd and last step, you will learn how to list your NFT for sale on a marketplace.

Run the following command to execute each script once you have read carefully the comments (replace FILENAME with the correct file name):

```bash showLineNumbers
  npm run start src/basics/FILENAME.ts
```

Impressive, isn't it? Just one line of code to create an NFT and another single line to list it on a marketplace. Exciting, isn't it? Now, you're all set to kickstart your dApp development journey using our toolkit. Let's get started!

## Looking for a more advanced use case?

Just follow the advanced guide:

- `01-mintSecretNFT.ts`: In this 1st advanced step you will see how to create a secret NFT, upload metadata on IPFS, encrypt content and send some private key shares on a TEE/SGX Cluster.


## About Ternoa

[Ternoa](https://ternoa.network) is a Decentralized, Open source, NFT-centric Layer 1 blockchain that is multi-chain by design and aims to provide a technical stack to build scalable and secure NFTs with native support for advanced features.
