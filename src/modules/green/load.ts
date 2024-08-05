import { BigNumber } from "ethers";

import type { GreenDetails, MasaInterface } from "../../interface";
import { isBigNumber, patchMetadataUrl } from "../../utils";

export const loadGreenDetails = async (
  masa: MasaInterface,
  greenIds: BigNumber[],
): Promise<GreenDetails[]> => {
  return (
    await Promise.all(
      greenIds.map(async (tokenId: BigNumber) => {
        const tokenUri = patchMetadataUrl(
          masa,
          await masa.contracts.instances.SoulboundGreenContract.tokenURI(
            tokenId,
          ),
        );

        if (masa.config.verbose) {
          console.info(`Green Metadata URL: '${tokenUri}'`);
        }

        return {
          tokenId,
          tokenUri,
        };
      }),
    )
  ).filter((green: GreenDetails) => Boolean(green.metadata));
};

export const loadGreens = async (
  masa: MasaInterface,
  identityIdOrAddress: BigNumber | string,
): Promise<GreenDetails[]> => {
  let greenIds: BigNumber[] = [];

  try {
    // do we have a soul linker here? use it!
    if (masa.contracts.instances.SoulLinkerContract.hasAddress) {
      const {
        "getSBTConnections(address,address)": getSBTConnectionsByAddress,
        "getSBTConnections(uint256,address)": getSBTConnectionsByIdentity,
      } = masa.contracts.instances.SoulLinkerContract;

      greenIds = await (isBigNumber(identityIdOrAddress)
        ? getSBTConnectionsByIdentity(
            identityIdOrAddress,
            masa.contracts.instances.SoulboundGreenContract.address,
          )
        : getSBTConnectionsByAddress(
            identityIdOrAddress,
            masa.contracts.instances.SoulboundGreenContract.address,
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
        await masa.contracts.instances.SoulboundGreenContract.balanceOf(
          identityAddress,
        )
      ).toNumber();

      if (balance > 0) {
        for (let i = 0; i < balance; i++) {
          greenIds.push(
            await masa.contracts.instances.SoulboundGreenContract.tokenOfOwnerByIndex(
              identityAddress,
              i,
            ),
          );
        }
      }
    }
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error(`Loading green failed! ${error.message}`);
    }
  }

  return await loadGreenDetails(masa, greenIds);
};
