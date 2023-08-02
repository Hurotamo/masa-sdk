import { SupportedNetworks } from "./collections";
import { MasaContracts } from "./contracts";
import type {
  MasaArgs,
  MasaConfig,
  MasaInterface,
  NetworkName,
} from "./interface";
import { MasaAccount } from "./modules/account";
import { MasaCreditScore } from "./modules/credit-score";
import { MasaGreen } from "./modules/green";
import { MasaIdentity } from "./modules/identity";
import { MasaSBTBase } from "./modules/sbt";
import { MasaASBT } from "./modules/sbt/ASBT";
import { MasaSSSBT } from "./modules/sbt/SSSBT";
import { MasaSession } from "./modules/session";
import { MasaSoulName } from "./modules/soul-name";
import { version } from "./modules/version";
import { getNetworkNameByChainId, MasaArweave, MasaClient } from "./utils";

export class Masa implements MasaInterface {
  // config
  readonly config: MasaConfig;
  // clients
  readonly arweave: MasaArweave;
  readonly client: MasaClient;
  // contracts
  readonly contracts: MasaContracts;
  // modules
  readonly account: MasaAccount;
  readonly session: MasaSession;
  readonly identity: MasaIdentity;
  readonly soulName: MasaSoulName;
  readonly creditScore: MasaCreditScore;
  readonly green: MasaGreen;
  readonly sbt: MasaSBTBase;
  readonly asbt: MasaASBT;
  readonly sssbt: MasaSSSBT;

  public constructor({
    cookie,
    signer,
    apiUrl = "https://middleware.masa.finance",
    environment = "production",
    networkName = "ethereum",
    arweave = {
      host: "arweave.net",
      port: 443,
      protocol: "https",
    },
    contractOverrides,
    verbose = false,
  }: MasaArgs) {
    // build config
    this.config = {
      apiUrl,
      environment,
      networkName,
      network: SupportedNetworks[networkName],
      signer,
      verbose,
    };

    // masa client
    this.client = new MasaClient({
      masa: this,
      apiUrl,
      cookie,
    });

    // arweave client
    this.arweave = new MasaArweave(arweave, this.config);

    // masa contracts wrapper
    this.contracts = new MasaContracts(this, contractOverrides);
    // account + session
    this.account = new MasaAccount(this);
    this.session = new MasaSession(this);
    // identity
    this.identity = new MasaIdentity(this);
    // soul name
    this.soulName = new MasaSoulName(this);
    // credit score
    this.creditScore = new MasaCreditScore(this);
    // green
    this.green = new MasaGreen(this);
    // generic sbt handler
    this.sbt = new MasaSBTBase(this);
    // ASBT handler
    this.asbt = new MasaASBT(this);
    // SSSBT Handler
    this.sssbt = new MasaSSSBT(this);
  }

  utils = {
    version,
  };

  public static create = async (args: MasaArgs) => {
    const network = await args.signer.provider?.getNetwork();
    let networkName: NetworkName = network
      ? getNetworkNameByChainId(network.chainId)
      : "ethereum";

    if (network?.name === "homestead") {
      networkName = "ethereum";
    } else if (network?.name === "celo-alfajores") {
      networkName = "alfajores";
    }

    return new Masa({
      ...args,
      networkName: networkName as NetworkName,
      // network ? getNetworkNameByChainId(network.chainId) : "ethereum",
    });
  };
}
