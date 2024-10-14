import { APIGatewayProxyEventV2 } from "aws-lambda";

export const generateInvalidBodyEvents = (
  requiredFields: Record<string, "string" | "number">,
): APIGatewayProxyEventV2[] => {
  const requiredFieldEntries = Object.entries(requiredFields);
  const perfectBody: Record<string, "" | 0> = Object.fromEntries(
    requiredFieldEntries.map(([fieldName, fieldValType]) => {
      switch (fieldValType) {
        case "string":
          return [fieldName, ""];
        case "number":
          return [fieldName, 0];
        default:
          throw new Error("Invalid field value type");
      }
    }) as [keyof typeof requiredFields, "" | 0][],
  );

  const invalidBodies = [
    {},
    // if one of the fields is missing
    ...requiredFieldEntries.map(([fieldName]) => ({
      ...perfectBody,
      [fieldName]: undefined,
    })),
    // if one of the fields is not the right type
    ...requiredFieldEntries.map(([fieldName, fieldValType]) => {
      let fieldVal: "" | 0;
      switch (fieldValType) {
        case "string":
          fieldVal = 0;
          break;

        case "number":
          fieldVal = "";
          break;

        default:
          throw new Error("Invalid field value type");
      }
      return {
        ...perfectBody,
        [fieldName]: fieldVal,
      };
    }),
  ];
  const events = invalidBodies.map((body) => ({
    body: JSON.stringify(body),
  })) as APIGatewayProxyEventV2[];
  return events;
};
