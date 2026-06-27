export type TokenPayload = {
  userId: string;
  email: string;
};

export interface TokenService {
  sign(payload: TokenPayload): Promise<string>;
  verify(token: string): Promise<TokenPayload>;
}
