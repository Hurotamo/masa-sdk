import type { BigNumber } from "@ethersproject/bignumber";

import type { MasaInterface } from "../../interface";
import { CreditScoreDetails } from "../../interface";
import { isBigNumber, patchMetadataUrl } from "../../utils";

export const loadCreditScoreDetails = async (
  masa: MasaInterface,
  creditScoreIds: BigNumber[],
): Promise<CreditScoreDetails[]> => {
  return (
    await Promise.all(
      creditScoreIds.map(async (tokenId: BigNumber) => {
        const tokenUri = patchMetadataUrl(
          masa,
          await masa.contracts.instances.SoulboundCreditScoreContract.tokenURI(
            tokenId,
          ),
        );

        if (masa.config.verbose) {
          console.info(`Credit Score Metadata URL: '${tokenUri}'`);
        }

        return {
          tokenId,
          tokenUri,
        };
      }),
    )
  ).filter((creditScore: CreditScoreDetails) => Boolean(creditScore.metadata));
};

export const loadCreditScores = async (
  masa: MasaInterface,
  identityIdOrAddress: BigNumber | string,
): Promise<CreditScoreDetails[]> => {
  let creditScoreIds: BigNumber[] = [];

  try {
    // do we have a soul linker here? use it!
    if (masa.contracts.instances.SoulLinkerContract.hasAddress) {
      const {
        "getSBTConnections(address,address)": getSBTConnectionsByAddress,
        "getSBTConnections(uint256,address)": getSBTConnectionsByIdentity,
      } = masa.contracts.instances.SoulLinkerContract;

      creditScoreIds = await (isBigNumber(identityIdOrAddress)
        ? getSBTConnectionsByIdentity(
            identityIdOrAddress,
            masa.contracts.instances.SoulboundCreditScoreContract.address,
          )
        : getSBTConnectionsByAddress(
            identityIdOrAddress,
            masa.contracts.instances.SoulboundCreditScoreContract.address,
          ));
    }
    // no soul linker, lets try by identity or address
    else {
      let identityAddress: string;

      if (isBigNumber(identityIdOrAddress)) {
        identityAddress =
          await masa.contracts.instances.SoulboundIdentityContract[
            "ownerOf(uint256)"
          ](identityIdOrAddress);
      } else {
        identityAddress = identityIdOrAddress as string;
      }

      const balance: number = (
        await masa.contracts.instances.SoulboundCreditScoreContract.balanceOf(
          identityAddress,
        )
      ).toNumber();

      if (balance > 0) {
        for (let i = 0; i < balance; i++) {
          creditScoreIds.push(
            await masa.contracts.instances.SoulboundCreditScoreContract.tokenOfOwnerByIndex(
              identityAddress,
              i,
            ),
          );
        }
      }
    }
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error(`Loading credit scores failed! ${error.message}`);
    }
  }

  return loadCreditScoreDetails(masa, creditScoreIds);
};
