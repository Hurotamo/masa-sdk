import type { ReferenceSBTSelfSovereign } from "@masa-finance/masa-contracts-identity";
import {
  abi,
  bytecode,
} from "@masa-finance/masa-contracts-identity/artifacts/contracts/reference/ReferenceSBTSelfSovereign.sol/ReferenceSBTSelfSovereign.json";
import { PaymentGateway } from "@masa-finance/masa-contracts-identity/dist/typechain/contracts/reference/ReferenceSBTSelfSovereign";
import { constants, ContractFactory } from "ethers";

import { Messages } from "../../../collections";
import { parseEthersError } from "../../../contracts/contract-modules/ethers";
import type { DeployResult, MasaInterface } from "../../../interface";
import { logger } from "../../../utils";
import PaymentParamsStruct = PaymentGateway.PaymentParamsStruct;

export const deploySSSBT = async ({
  masa,
  name,
  symbol,
  baseTokenUri,
  limit = 1,
  authorityAddress,
  adminAddress,
  paymentOptions,
}: {
  masa: MasaInterface;
  name: string;
  symbol: string;
  baseTokenUri: string;
  limit: number;
  authorityAddress?: string;
  adminAddress?: string;
  paymentOptions?: {
    projectFeeReceiver: string;
  };
}): Promise<DeployResult<PaymentParamsStruct> | undefined> => {
  let result: DeployResult<PaymentParamsStruct> | undefined;
  const signerAddress = await masa.config.signer.getAddress();

  adminAddress = adminAddress ?? signerAddress;
  authorityAddress = authorityAddress ?? signerAddress;

  logger(
    "log",
    `Deploying SSSBT contract to network '${masa.config.networkName}'`,
  );

  if (
    masa.contracts.instances.SoulboundIdentityContract.address ===
      constants.AddressZero ||
    !masa.contracts.instances.SoulboundIdentityContract.hasAddress
  ) {
    logger("warn", "Identity contract is not deployed to this network!");
  }

  const contractFactory: ContractFactory = new ContractFactory(
    abi,
    bytecode,
    masa.config.signer,
  );

  const deploySSSBTArguments: [
    string, // address admin
    string, // string name
    string, // string symbol
    string, // string baseTokenURI
    string, // address soulboundIdentity
    PaymentParamsStruct, // PaymentParams paymentParams
    number,
  ] = [
    adminAddress,
    name,
    symbol,
    baseTokenUri,
    masa.contracts.instances.SoulboundIdentityContract.address ??
      constants.AddressZero,
    {
      // get this from the sdk
      swapRouter: constants.AddressZero,
      // get this from the sdk
      wrappedNativeToken: constants.AddressZero,
      // get this from the sdk
      stableCoin: constants.AddressZero,
      masaToken:
        masa.config.network?.addresses.tokens?.MASA ?? constants.AddressZero,
      projectFeeReceiver:
        paymentOptions?.projectFeeReceiver ?? constants.AddressZero,
      // get this from the sdk
      protocolFeeReceiver: constants.AddressZero,
      protocolFeeAmount: 0,
      protocolFeePercent: 0,
      protocolFeePercentSub: 0,
    },
    limit,
  ];

  const abiEncodedDeploySSSBTArguments =
    contractFactory.interface.encodeDeploy(deploySSSBTArguments);
  if (masa.config.verbose) {
    logger("dir", {
      deploySSSBTArguments,
      abiEncodedDeploySSSBTArguments,
    });
  }

  try {
    const {
      addAuthority,
      deployTransaction: { wait, hash },
      address,
    } = (await contractFactory.deploy(
      ...deploySSSBTArguments,
    )) as ReferenceSBTSelfSovereign;

    logger(
      "log",
      Messages.WaitingToFinalize(
        hash,
        masa.config.network?.blockExplorerUrls?.[0],
      ),
    );

    await wait();

    if (adminAddress === signerAddress) {
      logger("log", `Adding authority: '${authorityAddress}' to '${address}'`);

      const { wait, hash } = await addAuthority(authorityAddress);

      logger(
        "log",
        Messages.WaitingToFinalize(
          hash,
          masa.config.network?.blockExplorerUrls?.[0],
        ),
      );

      await wait();
    } else {
      logger(
        "log",
        `Authority: ${authorityAddress} could not be added because ${signerAddress} is not the admin!`,
      );

      logger("log", `Please add authority manually from ${adminAddress}`);
    }

    logger(
      "log",
      `SSSBT successfully deployed to '${masa.config.networkName}' with contract address: '${address}'`,
    );

    result = {
      address,
      constructorArguments: deploySSSBTArguments,
      abiEncodedConstructorArguments: abiEncodedDeploySSSBTArguments,
    };
  } catch (error: unknown) {
    let msg = "SSSBT deployment failed! ";

    const { message } = parseEthersError(error);
    msg += message;

    logger("error", msg);
  }

  return result;
};
