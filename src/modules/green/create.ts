import { LogDescription } from "@ethersproject/abi";

import { BaseErrorCodes, Messages } from "../../collections";
import type {
  BaseResultWithTokenId,
  GenerateGreenResult,
  GreenBaseResult,
  MasaInterface,
  PaymentMethod,
  VerifyGreenResult,
} from "../../interface";

/**
 *
 * @param masa
 * @param phoneNumber
 */
export const generateGreen = async (
  masa: MasaInterface,
  phoneNumber: string,
): Promise<GenerateGreenResult> => {
  let result: GenerateGreenResult = {
    success: false,
    errorCode: BaseErrorCodes.UnknownError,
  };

  if (await masa.session.checkLogin()) {
    if (!masa.contracts.instances.SoulboundGreenContract.hasAddress) {
      result.message = Messages.ContractNotDeployed(masa.config.networkName);
      result.errorCode = BaseErrorCodes.NetworkError;
      return result;
    }

    try {
      const balance =
        await masa.contracts.instances.SoulboundGreenContract.balanceOf(
          await masa.config.signer.getAddress(),
        );

      if (balance.eq(0)) {
        const greenGenerateResult =
          await masa.client.green.generate(phoneNumber);

        if (masa.config.verbose) {
          console.dir({ greenGenerateResult }, { depth: null });
        }

        return greenGenerateResult;
      } else {
        const message = "Masa Green already created!";
        result = {
          ...result,
          message,
          status: "failed",
          errorCode: BaseErrorCodes.AlreadyExists,
        };
      }
    } catch (error: unknown) {
      if (error instanceof Error) {
        result.message = error.message;
      }
    }
  } else {
    result.message = Messages.NotLoggedIn();
  }

  return result;
};

/**
 *
 * @param masa
 * @param phoneNumber
 * @param code
 */
export const verifyGreen = async (
  masa: MasaInterface,
  phoneNumber: string,
  code: string,
): Promise<VerifyGreenResult | undefined> => {
  const result: VerifyGreenResult = {
    success: false,
    errorCode: BaseErrorCodes.UnknownError,
  };

  // try to verify with the code
  const greenVerifyResult = await masa.client.green.verify(phoneNumber, code);

  if (masa.config.verbose) {
    console.log({ greenVerifyResult });
  }

  // we got a verification result
  if (greenVerifyResult) {
    result.success = greenVerifyResult.success;
    delete result.errorCode;
    result.status = greenVerifyResult.status;
    result.message = greenVerifyResult.message;

    if (
      greenVerifyResult.signature &&
      greenVerifyResult.signatureDate &&
      greenVerifyResult.authorityAddress
    ) {
      // unpack the relevant data we need to proceed
      result.signature = greenVerifyResult.signature;
      result.signatureDate = greenVerifyResult.signatureDate;
      result.authorityAddress = greenVerifyResult.authorityAddress;
    } else if (greenVerifyResult.errorCode) {
      result.message = "Unknown Verify Error";
      // error code, unpack the error code
      result.errorCode = greenVerifyResult.errorCode;
    }
  }

  return result;
};

/**
 *
 * @param masa
 * @param paymentMethod
 * @param authorityAddress
 * @param signatureDate
 * @param signature
 */
export const mintGreen = async (
  masa: MasaInterface,
  paymentMethod: PaymentMethod,
  authorityAddress: string,
  signatureDate: number,
  signature: string,
): Promise<BaseResultWithTokenId> => {
  let result: BaseResultWithTokenId = {
    success: false,
    errorCode: BaseErrorCodes.UnknownError,
  };

  const { wait, hash } = await masa.contracts.green.mint(
    paymentMethod,
    await masa.config.signer.getAddress(),
    authorityAddress,
    signatureDate,
    signature,
  );

  console.log(
    Messages.WaitingToFinalize(
      hash,
      masa.config.network?.blockExplorerUrls?.[0],
    ),
  );

  const { logs } = await wait();

  const parsedLogs = masa.contracts.parseLogs(logs);

  let tokenId: string | undefined;

  const greenMintEvent = parsedLogs.find(
    (event: LogDescription) => event.name === "Mint",
  );

  if (greenMintEvent) {
    if (masa.config.verbose) {
      console.dir({ greenMintEvent }, { depth: null });
    }

    tokenId = greenMintEvent.args._tokenId.toString();
    console.log(`Green with ID: '${tokenId}' created.`);
  }

  if (tokenId) {
    result = {
      ...result,
      success: true,
      tokenId,
    };
  }

  return result;
};

/**
 *
 * @param masa
 * @param paymentMethod
 * @param phoneNumber
 * @param code
 */
export const createGreen = async (
  masa: MasaInterface,
  paymentMethod: PaymentMethod,
  phoneNumber: string,
  code: string,
): Promise<GreenBaseResult> => {
  const result: GreenBaseResult = {
    success: false,
    errorCode: BaseErrorCodes.UnknownError,
  };

  // verify
  const verifyGreenResult: VerifyGreenResult | undefined = await verifyGreen(
    masa,
    phoneNumber,
    code,
  );

  if (masa.config.verbose) {
    console.log({ verifyGreenResult });
  }

  if (verifyGreenResult) {
    result.status = verifyGreenResult.status;
    result.message = verifyGreenResult.message;

    if (
      verifyGreenResult.authorityAddress &&
      verifyGreenResult.signatureDate &&
      verifyGreenResult.signature
    ) {
      // mint
      const mintGreenResult = await mintGreen(
        masa,
        paymentMethod,
        verifyGreenResult.authorityAddress,
        verifyGreenResult.signatureDate,
        verifyGreenResult.signature,
      );

      if (masa.config.verbose) {
        console.log({ mintGreenResult });
      }

      if (mintGreenResult) {
        result.success = true;
        delete result.errorCode;
        result.tokenId = mintGreenResult.tokenId;
      }
    } else {
      result.errorCode = verifyGreenResult.errorCode;
    }
  }

  return result;
};
