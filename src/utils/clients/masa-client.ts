import type { AxiosError, AxiosInstance, AxiosResponse } from "axios";
import axios from "axios";

import type {
  ChallengeResult,
  ChallengeResultWithCookie,
  GenerateCreditScoreResult,
  GenerateGreenResult,
  ICreditScore,
  IGreen,
  IIdentity,
  ISession,
  LogoutResult,
  MasaInterface,
  NetworkName,
  SessionUser,
  SoulNameMetadataStoreResult,
  SoulNameResultBase,
  UpdateCreditScoreResult,
  VerifyGreenResult,
} from "../../interface";
import { MasaBase } from "../../masa-base";

const headers = {
  "Content-Type": "application/json",
};

export class MasaClient extends MasaBase {
  private _middlewareClient: AxiosInstance;
  private _cookie?: string;

  get cookie() {
    return this._cookie;
  }

  constructor({
    masa,
    apiUrl,
    cookie,
  }: {
    masa: MasaInterface;
    apiUrl: string;
    cookie?: string;
  }) {
    super(masa);
    this._cookie = cookie;

    this._middlewareClient = axios.create({
      baseURL: apiUrl,
      withCredentials: true,
      headers,
    });
  }

  session = {
    /**
     * Check session is still alive
     */
    check: async (): Promise<ISession | undefined> => {
      return await this.get<ISession>("/session/check", true);
    },

    /**
     *
     * @param address
     * @param signature
     * @param cookie
     */
    checkSignature: async (
      address: string,
      signature: string,
      cookie?: string,
    ): Promise<SessionUser | undefined> => {
      let result;

      const cookieToUse = cookie || this.cookie;

      const checkSignatureResponse = await this._middlewareClient
        .post<
          {
            address: string;
            signature: string;
          },
          AxiosResponse<SessionUser>
        >(
          "/session/check-signature",
          {
            address,
            signature,
          },
          {
            headers: {
              cookie: cookieToUse ? [cookieToUse] : undefined,
            },
          },
        )
        .catch((error: Error | AxiosError) => {
          console.error("Check signature failed!", error.message);
        });

      const { data: checkSignatureResponseData, status } =
        checkSignatureResponse || {};

      if (this.masa.config.verbose) {
        console.info({
          checkSignatureResponse: {
            status,
            checkSignatureResponseData,
          },
        });
      }

      if (checkSignatureResponseData) {
        // set the cookie here, so we can reuse it during the lifespan of the
        // masa object if it is not set yet
        if (cookie && !this.cookie) {
          this._cookie = cookie;
        }

        result = checkSignatureResponseData;
      }

      return result;
    },

    /**
     * Get challenge
     */
    getChallenge: async (): Promise<ChallengeResultWithCookie | undefined> => {
      let result;

      const getChallengeResponse = await this._middlewareClient
        .get<ChallengeResult>("/session/get-challenge")
        .catch((error: Error | AxiosError) => {
          console.error("Get Challenge failed!", error.message);
        });

      if (getChallengeResponse) {
        const cookies = getChallengeResponse.headers["set-cookie"];

        let cookie;
        if (!cookies || cookies.length < 1) {
          console.warn("No cookies in response!");
        } else {
          cookie = cookies[0];
        }

        const { data: getChallengeResponseData, status } =
          getChallengeResponse || {};

        if (this.masa.config.verbose) {
          console.info({
            getChallengeResponse: {
              status,
              getChallengeResponseData,
              cookie,
            },
          });
        }

        if (getChallengeResponseData) {
          result = {
            ...getChallengeResponseData,
            cookie,
          };
        }
      }

      return result;
    },

    logout: async (): Promise<LogoutResult | undefined> => {
      const { data: logoutResult } = await this.post<undefined, LogoutResult>(
        "/session/logout",
        undefined,
      );
      delete this._cookie;
      return logoutResult;
    },
  };

  metadata = {
    /**
     * Retrieve metadata
     * @param uri
     * @param additionalHeaders
     */
    get: async (
      uri: string,
      additionalHeaders?: Record<string, string>,
    ): Promise<IIdentity | ICreditScore | IGreen | undefined> => {
      const headers = {
        cookie: this.cookie ? [this.cookie] : undefined,
        ...additionalHeaders,
      };

      const metadataResponse = await this._middlewareClient
        .get(uri, {
          headers,
        })
        .catch((error: Error | AxiosError) => {
          console.error("Failed to load Metadata!", error.message, uri);
        });

      const { data: metadataResponseData, status } = metadataResponse || {};

      if (this.masa.config.verbose) {
        console.dir(
          {
            metadataResponse: {
              status,
              metadataResponseData,
            },
          },
          {
            depth: null,
          },
        );
      }

      return metadataResponseData;
    },
  };

  soulName = {
    /**
     * Store metadata
     * @param soulName
     * @param receiver
     * @param duration
     * @param style
     */
    store: async (
      soulName: string,
      receiver: string,
      duration: number,
      style?: string,
    ): Promise<
      SoulNameMetadataStoreResult | SoulNameResultBase | undefined
    > => {
      console.log(`Writing metadata for '${soulName}'`);

      const { data: soulNameMetadataStoreResult } = await this.post<
        {
          soulName: string;
          receiver: string;
          duration: number;
          network: NetworkName;
          style?: string;
        },
        SoulNameMetadataStoreResult | SoulNameResultBase
      >("/soul-name/store", {
        soulName,
        receiver,
        duration,
        network: this.masa.config.networkName,
        style,
      });

      return soulNameMetadataStoreResult;
    },
  };

  green = {
    /**
     * Generates a new masa green request
     * @param phoneNumber
     */
    generate: async (phoneNumber: string): Promise<GenerateGreenResult> => {
      const result = {
        success: false,
        status: "failed",
        message: "Generating green failed",
      };

      const { data: greenGenerateResponseData } = await this.post<
        {
          phoneNumber: string;
        },
        GenerateGreenResult
      >("/green/generate", {
        phoneNumber,
      });

      if (greenGenerateResponseData) {
        result.success = true;
        result.message = "";
        result.status = "success";
        return { ...result, ...greenGenerateResponseData };
      } else {
        result.message = `Generating green failed! ${result.message}`;
        console.error(result.message);
      }

      return result;
    },

    verify: async (
      phoneNumber: string,
      code: string,
    ): Promise<VerifyGreenResult | undefined> => {
      const result = {
        success: false,
        status: "failed",
        message: "Verifying green failed",
      };

      const { data: greenVerifyResponseData } = await this.post<
        {
          phoneNumber: string;
          code: string;
          network: NetworkName;
        },
        VerifyGreenResult
      >("/green/verify", {
        phoneNumber,
        code,
        network: this.masa.config.networkName,
      });

      if (greenVerifyResponseData) {
        result.success = true;
        result.message = "";
        result.status = "success";
        return { ...result, ...greenVerifyResponseData };
      } else {
        result.message = `Verifying green failed! ${result.message}`;
        console.error(result.message);
      }

      return result;
    },
  };

  creditScore = {
    /**
     * Generates a new credit score
     */
    generate: async (): Promise<GenerateCreditScoreResult | undefined> => {
      const result = {
        success: false,
        status: "failed",
        message: "Generating Credit Score failed!",
      };

      const generateCreditScoreResponseData = await this.post<
        {
          network: NetworkName;
        },
        GenerateCreditScoreResult
      >("/credit-score/generate", {
        network: this.masa.config.networkName,
      });

      if (generateCreditScoreResponseData) {
        result.success = true;
        result.message = "";
        result.status = "success";
        return { ...result, ...generateCreditScoreResponseData };
      } else {
        console.error(result.message);
        return result;
      }
    },

    /**
     * Update an existing credit score
     * @param transactionHash
     */
    update: async (
      transactionHash: string,
    ): Promise<UpdateCreditScoreResult | undefined> => {
      const result = {
        success: false,
        status: "failed",
        message: "Updating of credit score failed!",
      };

      const { data: updateCreditScoreResponseData } = await this.post<
        {
          transactionHash: string;
          network: NetworkName;
        },
        UpdateCreditScoreResult
      >("/credit-score/update", {
        transactionHash,
        network: this.masa.config.networkName,
      });

      if (updateCreditScoreResponseData) {
        result.success = true;
        result.message = "";
        result.status = "success";
        return { ...result, ...updateCreditScoreResponseData };
      } else {
        console.error(result.message);
      }

      return result;
    },
  };

  post = async <Payload, Result>(
    endpoint: string,
    data: Payload,
    silent: boolean = false,
  ): Promise<{
    data: Result | undefined;
    status: number | undefined;
    statusText: string | undefined;
  }> => {
    if (this.masa.config.verbose) {
      console.log(`Posting '${JSON.stringify(data)}' to '${endpoint}'`);
    }

    const postResponse = await this._middlewareClient
      .post<Payload, AxiosResponse<Result>>(endpoint, data, {
        withCredentials: true,
        headers: {
          cookie: this.cookie ? [this.cookie] : undefined,
        },
      })
      .catch((error: Error | AxiosError) => {
        if (!silent) {
          console.error(`Post '${endpoint}' failed!`, error.message);
        }
      });

    const { data: postResponseData, status, statusText } = postResponse || {};

    if (this.masa.config.verbose) {
      console.info({
        postResponse: {
          status,
          postResponseData,
        },
      });
    }

    return {
      data: postResponseData,
      status,
      statusText,
    };
  };

  patch = async <Payload, Result>(
    endpoint: string,
    data: Payload,
    silent: boolean = false,
  ): Promise<Result | undefined> => {
    if (this.masa.config.verbose) {
      console.log(`Patching '${JSON.stringify(data)}' to '${endpoint}'`);
    }

    const patchResponse = await this._middlewareClient
      .patch<Payload, AxiosResponse<Result>>(endpoint, data, {
        withCredentials: true,
        headers: {
          cookie: this.cookie ? [this.cookie] : undefined,
        },
      })
      .catch((error: Error | AxiosError) => {
        if (!silent) {
          console.error(`Patch '${endpoint}' failed!`, error.message);
        }
      });

    const { data: patchData, status } = patchResponse || {};

    if (this.masa.config.verbose) {
      console.info({
        patchResponse: {
          status,
          patchData,
        },
      });
    }

    return patchData;
  };

  get = async <Result>(
    endpoint: string,
    silent: boolean = false,
  ): Promise<Result | undefined> => {
    if (this.masa.config.verbose) {
      console.log(`Getting '${endpoint}'`);
    }

    const getResponse = await this._middlewareClient
      .get<Result>(endpoint, {
        withCredentials: true,
        headers: {
          cookie: this.cookie ? [this.cookie] : undefined,
        },
      })
      .catch((error: Error | AxiosError) => {
        if (!silent) {
          console.error(`Get '${endpoint}' failed!`, error.message);
        }
      });

    const { data: getData, status } = getResponse || {};

    if (this.masa.config.verbose) {
      console.dir(
        {
          getResponse: {
            status,
            getData,
          },
        },
        {
          depth: null,
        },
      );
    }

    return getData;
  };
}
