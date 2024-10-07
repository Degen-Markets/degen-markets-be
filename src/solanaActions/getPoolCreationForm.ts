import { ActionGetResponse, ACTIONS_CORS_HEADERS } from "@solana/actions";
import { defaultBanner } from "./constants";

const getPoolCreationForm = async () => {
  const formData: ActionGetResponse = {
    description:
      "Enter the details for your bet. After finishing, your bet will appear on @DegenMarketsBot.",
    icon: defaultBanner,
    title: "Create your own Bet!",
    label: "Create bet",
    links: {
      actions: [
        {
          label: "Create bet",
          type: "transaction",
          href: "/pools/create?title={title}&image={image}&description={description}",
          parameters: [
            {
              name: "title",
              type: "text",
              label: "Bet Title",
              required: true,
            },
            {
              name: "image",
              type: "url",
              label: "URL to your Image (leave empty for default)",
              required: false,
            },
            {
              name: "description",
              type: "textarea",
              max: 200,
            },
          ],
        },
      ],
    },
  };
  return {
    statusCode: 200,
    body: JSON.stringify(formData),
    headers: ACTIONS_CORS_HEADERS,
  };
};

export default getPoolCreationForm;
