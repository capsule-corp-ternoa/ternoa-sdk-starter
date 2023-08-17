import fs from "fs";
import dotenv from "dotenv";
dotenv.config();
import {
  initializeApi,
  getKeyringFromSeed,
  File,
  WaitUntil,
  safeDisconnect,
  generatePGPKeys,
  TernoaIPFS,
  secretNftEncryptAndUploadFile,
  getEnclaveHealthStatus,
  createSecretNft,
  prepareAndStoreKeyShares,
  SecretNftData,
  TeeSharesStoreType,
} from "ternoa-js";

// We asume the you already know the basic features of the Ternoa SDK as we are going to dive into some more advanced concepts.
// In case you need to familiarize yourself about how to use the Ternoa SDK please look at our documentation and the firsts basics example: https://docs.ternoa.network/

// Secret NFTs are an addition to the Basic NFTs: The secret consists of an immutable media that is encrypted using generated PGP keys.
// After encrypting the media, the PGP private key is split into shares using Shamir's Secret Sharing algorithm.
// Each private key share is securely stored on a cluster in an enclave using the TEE technology, where individuals or centralized entities other than the current owner of the Secret NFT cannot access them.
// To view a secret, the NFT owner will request the shares for each enclave.
// The request consists of the NFT id and a signed message.
// Once the NFT ownership is verified, the TEE enclaves will return the shares.
// The PGP Private Key can be reconstructed with the shares, and the secret media is decrypted.

// Let's cover this process.

const mintSecretNFT = async (): Promise<{
  event: SecretNftData;
  clusterResponse: TeeSharesStoreType[];
}> => {
  console.log("Starting to create your Secret NFT");
  try {
    // Here, we initialize the SDK API to connect to the Ternoa Chain.
    // You can optionaly specify the chain endpoint by passing the endpoint address as the first argument.
    // The default endpoint is Alphanet: "wss://alphanet.ternoa.com"
    await initializeApi();
    console.log(
      "Ternoa-JS API initialized: you're connected to the Ternoa Alphanet Network"
    );

    // Creating a secret NFT requires to prepare a bunch of assets and metadata.
    // Instead of using a random string for all the offchain metadata of the secret NFT, we will store some real assets and data on a decentralized storage provider: IPFS.
    // As explained in the documentation, you can generate your own IPFS key using our key manager : https://ipfs-key-manager-git-dev-ternoa.vercel.app/

    // IPFS CLUSTER ADDRESS AND KEY
    const IPFS_NODE_URL =
      process.env.IPFS_NODE_URL ?? "https://ipfs-dev.trnnfr.com";
    const IPFS_API_KEY = process.env.IPFS_API_KEY;

    // NFT MEDIA WITH NFT METADATA
    const FILE = "pfp.jpeg";
    const nftFile = new File([await fs.promises.readFile(FILE)], FILE, {
      type: "image/jpg",
    });

    const nftMetadata = {
      title: "SECRET_NFT_TUTORIAL: Public NFT Title",
      description: "SECRET_NFT_TUTORIAL: Public NFT Description",
    };

    // NFT SECRET MEDIA WITH NFT METADATA RELATED TO SECRET MEDIA
    const SECRET_FILE = "poap.mp4";
    const secretNftFile = new File(
      [await fs.promises.readFile(SECRET_FILE)],
      SECRET_FILE,
      {
        type: "video/mp4",
      }
    );

    const secretNftMetadata = {
      title: "SECRET_NFT_TUTORIAL: Secret NFT Title",
      description: "SECRET_NFT_TUTORIAL: Secret NFT Description",
    };

    // PUBLIC AND PRIVATE KEY CREATION TO STORE ON TEE CLUSTER OF ENCLAVES AND IPFS
    const { privateKey, publicKey } = await generatePGPKeys();

    // CONNECTION TO THE TERNOA IPFS CLIENT BEOFRE
    const ipfsClient = new TernoaIPFS(new URL(IPFS_NODE_URL), IPFS_API_KEY);

    // We first store the basic NFT media and metadata to get an hash string
    const { Hash: offchainDataHash } = await ipfsClient.storeNFT(
      nftFile,
      nftMetadata
    );
    console.log(
      "Find your NFT IPFS hash:",
      `${IPFS_NODE_URL}/ipfs/${offchainDataHash}`
    );

    // Because we want the secret content to be "secret", we want first to encrypt it before storing it on IPFS.
    // We cover you with this usefull helper.
    const { Hash: secretOffchainDataHash } =
      await secretNftEncryptAndUploadFile(
        secretNftFile,
        publicKey,
        ipfsClient,
        secretNftMetadata
      );
    console.log(
      "Find your Secret NFT IPFS hash with encrypted content:",
      `${IPFS_NODE_URL}/ipfs/${secretOffchainDataHash}`
    );

    // Here, we retrieve the keyring from the provided account seed before creating the Secret NFT.

    // Communication on the blockchain is achieved through executing extrinsics, also called transactions or tx.
    // In order to execute transactions, a keyring (containing your address) needs to sign them and pay the execution fee.
    // We provide a default account that you can use in this exercise, but we strongly recommend to use your own account by
    // changing //TernoaTestAccount with your account seed.
    const keyring = await getKeyringFromSeed("//TernoaTestAccount");
    console.log("Keyring set and ready to use for creating your first NFT");

    // This next single line function to create a secret NFT requires a few parameters:
    // the public and visible offchain data of the NFT: here the hash previously store on IPFS,
    // the secret and encrypted offchain data of the NFT: here the second hash previously store on IPFS,
    // a royalty in case you sell your secret NFT,
    // a collectionId if you want this secret NFT to belong to a collection,
    // a boolean to define its isSoulbound status,
    // the keyring that will be used to sign and submit the transaction,
    // and a WaitUntil callback parameter:

    // WaitUntil define at which point we want to get the results of the transaction execution.
    // Either we get the results when the transaction is included in the block (BlockInclusion)
    // or when the transaction is included in the block and that block is also finalized (BlockFinalization).

    // It's important to know that besides the transaction fees the signer also pays additional secrert NFT Mint fee for every minted secret NFT.
    const secretNftEvent = await createSecretNft(
      offchainDataHash,
      secretOffchainDataHash,
      0,
      undefined,
      false,
      keyring,
      WaitUntil.BlockInclusion
    );

    console.log("The on-chain secret NFT created event: ", secretNftEvent);

    // The secret NFT is now created, but we have one more step to go through:
    // Sync our secret NFT on the TEE/SGX cluster: store the private key to decrypt the content later.
    // By default we store our key share on the cluster id 0, but you might have to update it according to your needs.
    const CLUSTER_ID = 0;

    // THE GOOD PRACTICE IS TO CHECK THE CLUSTER AND ENCLAVES AVAILABILITY.
    await getEnclaveHealthStatus(CLUSTER_ID);

    // Because interacting with the TEE/SGX Cluster is an heavy process,
    // we provide a very helpfull helper that allow you to store your assets in only one line of code.

    // Just provide the few parameters below:
    // privateKey: The private key to be split with Shamir algorithm.
    // signer: Account owner of the private key to split (keyring) or address (string) .
    // nftId: The Capsule NFT id or Secret NFT id to link to the private key.
    // kind: The kind of nft linked to the key to upload: "secret" or "capsule".
    // extensionInjector: (Optional)The signer method retrived from your extension to sign the transaction. We recommand Polkadot extention: object must have a signer key.
    // clusterId: (Optional)The TEE Cluster id. Default is set to cluster id 0.
    const teeRes = await prepareAndStoreKeyShares(
      privateKey,
      keyring,
      secretNftEvent.nftId,
      "secret",
      undefined,
      CLUSTER_ID
    );

    console.log("The TEE/SGX Cluster response: ", teeRes);
    console.log(
      "Hehe, heavy process but hell yes, we just create an encrypted secret NFT"
    );
    console.log("Well done folks! See you later 👋");
  } catch (e) {
    console.error(e);
  } finally {
    await safeDisconnect();
    process.exit();
  }
};

// To run this function => npm run start src/advanced/01_mintSecretNFT.ts
mintSecretNFT();
