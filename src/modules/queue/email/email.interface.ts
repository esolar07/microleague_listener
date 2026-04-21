export interface RECEIVE_BID_INTERFACE {
  email: string;
  tokenName: string;
  price: string;
  image?: string;
  bidderName?: string;
}

export interface SEND_BID_INTERFACE {
  email: string;
  tokenName: string;
  price: string;
  image?: string;
  ownerName?: string;
  bidderName?: string;
}
export interface LISTED_FOR_SALE_INTERFACE {
  email: string;
  tokenName: string;
  amount: number;
  image: string;
}

export interface BUY_TOKEN_INTERFACE {
  email: string;
  tokenName: string;
  tokenPrice: string;
  image?: string;
}
export interface TOKEN_OWNER_INTERFACE {
  email: string;
  userName: string;
  tokenName: string;
  tokenPrice: string;
  image?: string;
  buyerName?: string;
}
export interface TOKEN_OWNER_CANCELD {
  email: string;
  userName: string;
  tokenName: string;
  image?: string;
  buyerName?: string;
}

export interface BOX_MINT_INTERFACE {
  email: string;
  fullname: string;
  url: string;
}
