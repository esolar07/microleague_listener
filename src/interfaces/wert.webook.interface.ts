type PartnerData = {
  sc_id: string;
  sc_address: string;
  sc_input_data: string;
};

type Order = {
  id: string;
  base: string;
  base_amount: string;
  quote: string;
  quote_amount: string;
  address: string;
  transaction_id: string;
  partner_data: PartnerData;
};

export interface WertWebhokData {
  type: "order_complete";
  click_id: string;
  order: Order;
}
