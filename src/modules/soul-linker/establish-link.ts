import { BigNumber, Contract } from "ethers";

import { BaseErrorCodes, Messages } from "../../collections";
import type {
  BaseResult,
  IPassport,
  MasaInterface,
  PaymentMethod,
} from "../../interface";
import { logger } from "../../utils";
import { parsePassport } from "./parse-passport";

export type EstablishLinkResult = BaseResult;

export const establishLink = async (
  masa: MasaInterface,
  paymentMethod: PaymentMethod,
  contract: Contract,
  tokenId: BigNumber,
  readerIdentityId: BigNumber,
  signature: string,
  signatureDate: number,
  expirationDate: number,
): Promise<EstablishLinkResult> => {
  const result: EstablishLinkResult = {
    success: false,
    errorCode: BaseErrorCodes.UnknownError,
  };

  const { identityId, address } = await masa.identity.load();
  if (!identityId) {
    result.message = Messages.NoIdentity(address);
    return result;
  }

  if (identityId.toString() !== readerIdentityId.toString()) {
    result.message = `Reader identity mismatch! This passport was issued for ${readerIdentityId.toString()}`;
    logger("error", result);

    return result;
  }

  let ownerAddress;
  const { identityId: ownerIdentityId } = await masa.identity.load(
    (ownerAddress = await contract.ownerOf(tokenId)),
  );

  if (!ownerIdentityId) {
    result.message = "Owner identity not found";
    result.errorCode = BaseErrorCodes.NotFound;
    logger("error", result);

    return result;
  }

  logger(
    "log",
    `Establishing link for '${await contract.name()}' (${
      contract.address
    }) ID: ${tokenId.toString()}`,
  );
  logger(
    "log",
    `from Identity ${ownerIdentityId.toString()} (${ownerAddress})`,
  );
  logger("log", `to Identity ${identityId.toString()} (${address})\n`);

  await masa.contracts.soulLinker.addLink(
    contract.address,
    paymentMethod,
    readerIdentityId,
    ownerIdentityId,
    BigNumber.from(tokenId),
    signatureDate,
    expirationDate,
    signature,
  );

  result.success = true;
  delete result.errorCode;

  return result;
};

export const establishLinkFromPassport = async (
  masa: MasaInterface,
  paymentMethod: PaymentMethod,
  contract: Contract,
  passport: string,
) => {
  const unpackedPassport: IPassport = parsePassport(passport);

  return await establishLink(
    masa,
    paymentMethod,
    contract,
    BigNumber.from(unpackedPassport.tokenId),
    BigNumber.from(unpackedPassport.readerIdentityId),
    unpackedPassport.signature,
    unpackedPassport.signatureDate,
    unpackedPassport.expirationDate,
  );
};
