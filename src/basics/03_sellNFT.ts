import {
	initializeApi,
	getKeyringFromSeed,
	WaitUntil,
	safeDisconnect,
	listNft,
} from "ternoa-js";

// Change the nftId provided by default with the one created in step one (01_mintNFT.ts).
const NFT_ID = undefined;

const sellNFT = async () => {
	try {
		if (NFT_ID === undefined) throw new Error('Change the nftId provided by default with the one created in step one (01_mintNFT.ts).')

		// We first initialize the SDK API to connect to the Ternoa Chain.

		// You can optionaly specify the chain endpoint by passing the endpoint address as the first argument.
		// The default endpoint is Alphanet: "wss://alphanet.ternoa.com"
		await initializeApi();
		console.log(
			"Ternoa-JS API initialized: you're connected to the Ternoa Alphanet Network"
		);
		// It's not strictly necessary but the good practice is to initialize the API as soon as possible
		// in your project instead of initializing it in every functions.

		// Here, we create a keyring from the provided account seed.

		// Communication on the blockchain is achieved through executing extrinsics, also called transactions or tx.
		// In order to execute transactions, a keyring (containing your address) needs to sign them and pay the execution fee.
		// We provide a default account that you can use in this exercise, but we strongly recommend to use your own account by
		// changing //TernoaTestAccount with your account seed.
		const keyring = await getKeyringFromSeed("//TernoaTestAccount");
		console.log("Keyring set and ready to use.");

		// Here list our NFT for sale on a Marketplace we already created (Marketplace Id: 22).

		// To list an NFT for sale only a few params are needed: The NFT Id, the Marketplace Id where you want your NFT to be listed,
		// the price of the NFT (we set 100 CAPS), the keyring that will be used to sign and submit the transaction,
		// and a waitUntil callback parameter.

		// WaitUntil define at which point we want to get the results of the transaction execution.
		// Either we get the results when the transaction is included in the block (BlockInclusion)
		// or when the transaction is included in the block and that block is also finalized (BlockFinalization).

		const listedNft = await listNft(
			NFT_ID,
			22,
			100,
			keyring,
			WaitUntil.BlockInclusion
		);
		console.log(
			`Your NFT ${listedNft.nftId} is now listed for sale at: ${listedNft.priceRounded} CAPS`
		);

		console.log(
			"Congratulation folks! This is the end of your journey with us! 👋"
		);
	} catch (e) {
		console.error(e);
	} finally {
		await safeDisconnect();
		process.exit();
	}
};

sellNFT();
