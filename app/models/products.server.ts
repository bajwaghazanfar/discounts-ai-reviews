import { GET_PRODUCTS } from "app/graphql/products";
import { authenticate } from "../shopify.server";

interface Product {
  id: string;
  title: string;
  description: string;
}

export async function getProductByIds(request: Request, productIds: string[]) {
  const { admin } = await authenticate.admin(request);

  const response = await admin.graphql(GET_PRODUCTS, {
    variables: {
      ids: productIds,
    },
  });

  const { data } = await response.json();
  return data.nodes.filter(Boolean) as Product[];
}
