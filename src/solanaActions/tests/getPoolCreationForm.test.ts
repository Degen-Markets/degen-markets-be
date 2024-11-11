import getPoolCreationForm from "../getPoolCreationForm";

import { defaultBanner } from "../constants";
import { buildOkResponse } from "../../utils/httpResponses";
import { ACTIONS_CORS_HEADERS } from "@solana/actions";

const correctFormData = {
  label: "",
  description:
    "Enter the details for your bet. After finishing, your bet will appear on @DegenMarketsBot.",
  icon: defaultBanner,
  title: "Create your own Bet!",
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
            max: 100,
          },
          {
            name: "image",
            type: "url",
            label: "URL to your Image (leave empty for default)",
            required: false,
            max: 200,
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

describe("getPoolCreationForm", () => {
  it("should return the correct form data", async () => {
    const formData = await getPoolCreationForm();
    expect(formData).toEqual(
      buildOkResponse(correctFormData, ACTIONS_CORS_HEADERS),
    );
  });
});
