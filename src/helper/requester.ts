interface RequesterHeaders {
  [key: string]: string;
}

interface RequesterArguments {
  uri: string;
  authenticated?: boolean;
  retry?: boolean;
  method?: string;
  contentType?: string;
  sendLanguage?: boolean;
  headers?: RequesterHeaders;
  body?: any;
  credentials?: 'omit' | 'same-origin' | 'include';
}

interface RequesterInterface {
  accessToken: Promise<string>;
  requestAccessToken: () => Promise<string>;
  resetAccessToken: () => void;
  get: <T = unknown>(params: Omit<RequesterArguments, 'method'>) => Promise<[T, Headers]>;
  post: <T = unknown>(params: Omit<RequesterArguments, 'method'>) => Promise<[T, Headers]>;
  put: <T = unknown>(params: Omit<RequesterArguments, 'method'>) => Promise<[T, Headers]>;
  del: <T = unknown>(params: Omit<RequesterArguments, 'method'>) => Promise<[T, Headers]>;
  request: <T = unknown>(args: RequesterArguments) => Promise<[T, Headers]>;
}

const defaultAccessToken = () => Promise.resolve('');

/**
 * Wrapper around requesting resources form the backend
 */
class Requester implements RequesterInterface {
  /**
   * The baseUrl to request from
   */
  baseUrl: string;

  /**
   * A function that is used to request a new access token for the user
   */
  requestAccessToken: () => Promise<string>;

  /**
   * Default value for flag determining if the request should be authenticated or not
   */
  private authenticated: boolean;

  constructor(
    baseUrl: string,
    requestAccessToken: (() => Promise<string>) | undefined,
    authenticated: boolean
  ) {
    this.baseUrl = baseUrl;
    this.requestAccessToken = requestAccessToken || defaultAccessToken;
    this.authenticated = authenticated;
  }

  /**
   * The access token of the user
   */
  private _accessToken: string | null = null;

  /**
   * Get the current accessToken or request a new one
   */
  get accessToken(): Promise<string> {
    return (async () => {
      if (!this._accessToken) {
        this._accessToken = await this.requestAccessToken();
      }
      return this._accessToken;
    })();
  }

  /**
   * Reset the accessToken
   */
  resetAccessToken(): void {
    this._accessToken = null;
  }

  /**
   * Fire a network request with the given arguments
   */
  request = async <T = unknown>(args: RequesterArguments): Promise<[T, Headers]> => {
    const {
      uri,
      method = 'GET',
      authenticated = this.authenticated,
      retry = true,
      headers = {},
      body = null,
      contentType = 'application/json',
      credentials = 'omit',
    } = args;

    let response: Response | undefined;

    try {
      response = await fetch(`${this.baseUrl}${uri}`, {
        method: method,
        headers: {
          'Content-Type': contentType,
          ...(authenticated
            ? {
                Authorization: `Bearer ${await this.accessToken}`,
              }
            : {}),
          ...headers,
        },
        ...(body ? { body } : {}),
        credentials,
      });
    } catch (e: any) {
      // Most likely network or CORS error
      throw new Error(e);
    }

    if (!response) {
      throw new Error('No response');
    }

    if (response?.status === 401 && retry) {
      this.resetAccessToken();
      return this.request({ ...args, retry: false });
    }

    if (response?.status === 204) {
      return ['' as T, response.headers];
    }

    if (response?.status >= 200 && response.status < 300) {
      return /application\/json/.test(response.headers.get('Content-Type')!)
        ? [await response.json(), response.headers]
        : [(await response.text()) as any, response.headers];
    }

    throw new Error(await response.text());
  };

  /**
   * Get a resource
   */
  get = async <T = unknown>(params: Omit<RequesterArguments, 'method'>): Promise<[T, Headers]> =>
    this.request({ ...params, method: 'GET' });

  /**
   * Post a resource
   */
  post = async <T = unknown>(params: Omit<RequesterArguments, 'method'>): Promise<[T, Headers]> =>
    this.request({
      ...params,
      method: 'POST',
    });

  /**
   * Put a resource
   */
  put = async <T = unknown>(params: Omit<RequesterArguments, 'method'>): Promise<[T, Headers]> =>
    this.request({
      ...params,
      method: 'PUT',
    });

  /**
   * Delete a resource
   */
  del = async <T = unknown>(params: Omit<RequesterArguments, 'method'>): Promise<[T, Headers]> =>
    this.request({
      ...params,
      method: 'DELETE',
    });
}
export default Requester;
