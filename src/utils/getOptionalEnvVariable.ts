export const getOptionalEnvVariable = (
  variableName: string,
): string | undefined => {
  return process.env[variableName];
};
