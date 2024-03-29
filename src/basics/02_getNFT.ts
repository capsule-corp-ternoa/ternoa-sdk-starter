// Ternoa indexer is a record of the Ternoa Chain data.
// You can query data for some specific entities (NFT, Collection, Markeplace(...)) using graphql.
// In this tutorial, we use the graphql-request library.

import { request, gql } from "graphql-request";

// Change the nftId provided by default with the one created in step one (01_mintNFT.ts).
const NFT_ID = undefined;

// The function below prepares a stringified query to get NFT data from a specific NFT id.
const query = (id: number) => gql`
    {
      nftEntity(id: "${id}") {
        owner
        nftId
        offchainData
        collectionId
        royalty
        isSoulbound
      }
    }
`;

const getNftData = async () => {
	try {
		console.log("Sending query to the indexer...");
		if (NFT_ID === undefined) throw new Error('Change the const NFT_ID with the one created in step one (01_mintNFT.ts).')

		// Here we make the request to our indexer by providing both the endpoint and the query.
		const response = await request<{ nftEntity: NftType }>(
			"https://indexer-alphanet.ternoa.dev",
			query(NFT_ID)
		);

		console.log(response);
		console.log("Step 2 is over! See you later 👋");
	} catch (error) {
		console.error(error);
	} finally {
		process.exit();
	}
};

getNftData();

type NftType = {
	owner: string;
	nftId: string;
	offchainData: string;
	collectionId: string;
	royalty: number;
	isSoulbound: boolean;
};
