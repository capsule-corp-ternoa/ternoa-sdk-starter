import fs from "fs";
import dotenv from "dotenv";
dotenv.config();
import { IKeyringPair } from "@polkadot/types/types";

import { File, NFTCreatedEvent, WaitUntil } from "ternoa-js";
import { getKeyringFromSeed } from "ternoa-js/account";
import { batchAllTxHex, checkBatchAll, initializeApi, submitTxBlocking } from "ternoa-js/blockchain";
import { TernoaIPFS } from "ternoa-js/helpers/ipfs";
import { createNftTx, createCollection, transferNftTx } from "ternoa-js/nft";

// This tutorial walks you through a POAP distribution that we use during a IRL meetups, here are the steps:
// 1 - Collection assets preparation - IPFS upload
// 2 - Create Collection - on-chain
// 3 - Soulbound NFT assets preparation - IPFS upload
// 4 - Soulbound NFT batch minting - on-chain
// 5 - Transfers batch - on-chain

// MNEMONIC SEED
const SEED = process.env.MNEMONIC_SEED ?? "//TernoaTestAccount";

// IPFS
const IPFS_NODE_URL = process.env.IPFS_NODE_URL ?? "https://ipfs-dev.trnnfr.com";
const IPFS_API_KEY = process.env.IPFS_API_KEY;

// Attendees addresses
// Add at least one address here
const ADDRESSES = [""];

const prepareCollectionAssets = async (ipfsClient: TernoaIPFS, metadata: any) => {
  const profilePicture = new File([await fs.promises.readFile("pfp.jpeg")], "pfp.jpeg", {
    type: "image/jpeg",
  });

  const bannerPicture = new File([await fs.promises.readFile("banner.png")], "banner.png", {
    type: "image/png",
  });

  const { Hash } = await ipfsClient.storeCollection(profilePicture, bannerPicture, metadata);

  console.log("The off-chain metadata CID hash is ", Hash);
  return Hash;
};

const prepareNFTAssets = async (ipfsClient: TernoaIPFS, metadata: any) => {
  const file = new File([await fs.promises.readFile("poap.mp4")], "poap.mp4", {
    type: "video/mp4",
  });

  const { Hash } = await ipfsClient.storeNFT(file, metadata);
  console.log("The off-chain metadata CID hash is ", Hash);
  return Hash;
};

const mintCollection = async (offchainData: string, limit: number, keyring: IKeyringPair) => {
  try {
    const collectionData = await createCollection(offchainData, limit, keyring, WaitUntil.BlockInclusion);
    console.log("The on-chain Collection id is: ", collectionData.collectionId);
    return collectionData;
  } catch (e) {
    console.error(e);
  }
};

const batchMintingNFT = async (quantity: number, offchainData: string, collectionId?: number) => {
  const nftTx = await createNftTx(offchainData, 0, collectionId, true);
  const nftsTxs = new Array(Number(quantity)).fill(nftTx);
  return await batchAllTxHex(nftsTxs);
};

const batchTransfer = async (addresses: string[], nftIds: number[]) => {
  if (nftIds.length < addresses.length) throw new Error("Not enough NFTs for all participants");
  const nftTransferTxs = await Promise.all(
    addresses.map(async (address, idx) => await transferNftTx(nftIds[idx], address))
  );
  return await batchAllTxHex(nftTransferTxs);
};

const main = async () => {
  try {
    // Setup - Init
    await initializeApi();
    const keyring = await getKeyringFromSeed(SEED);
    const ipfsClient = new TernoaIPFS(new URL(IPFS_NODE_URL), IPFS_API_KEY);
    const quantity = ADDRESSES.length;

    // STEP 1: Collection assets preparation - IPFS upload
    const collectionMetadata = {
      name: "Ternoa - SDK Starter Collection",
      description: "Describe this collection here",
    };
    const collectionOffchainData = await prepareCollectionAssets(ipfsClient, collectionMetadata);

    // STEP 2: Create Collection - on-chain
    const collectionEvent = await mintCollection(collectionOffchainData, quantity, keyring);
    const collectionId = collectionEvent?.collectionId;

    // STEP 3: NFT assets preparation - IPFS upload
    const nftMetadata = {
      title: "Ternoa Builder Badge",
      description: "This badge is the gateway to the Ternoa Builders Experience.",
      properties: {
        categories: ["Collectible"],
        Type: "Ternoa - SDK Starter Badge",
        City: "Ternoa - SDK Starter remote",
        Year: "2023",
        Quantity: quantity,
      },
    };
    const nftOffchainData = await prepareNFTAssets(ipfsClient, nftMetadata);

    // STEP 4: NFT batch minting - on-chain
    const nftBatchTx = await batchMintingNFT(quantity, nftOffchainData, collectionId);
    const nftBatchData = await submitTxBlocking(nftBatchTx, WaitUntil.BlockInclusion, keyring);
    const createNftEvents = nftBatchData.events.findEvents(NFTCreatedEvent);
    const nftIds = createNftEvents.map((x) => x.nftId);
    console.log("The on-chain NFT ids are: ", nftIds);

    // STEP 5: Transfers batch - on-chain
    const transferBatchTx = await batchTransfer(ADDRESSES, nftIds);
    const transferBatchData = await submitTxBlocking(transferBatchTx, WaitUntil.BlockInclusion, keyring);
    const isSuccess = checkBatchAll(transferBatchData.events).isTxSuccess;
    console.log("Tranfer success:", isSuccess);
    console.log(`View the collection on Secret Stash: https://alphanet.secret-stash.io/collection/${collectionId}`);
  } catch (err) {
    console.log(err);
  }
};

main();
