import { useLoaderData } from "@remix-run/react";
import { Page, Text } from "@shopify/polaris";

export const loader = async () => {
  return { ok: true };
};

export default function Discounts() {
  const data = useLoaderData<typeof loader>();

  return (
    <Page title="Discounts">
      <Text variant="headingMd" as="p">
        Create BOGO and Free Gift Discounts
      </Text>
    </Page>
  );
}
