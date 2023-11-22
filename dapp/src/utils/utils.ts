export const formatCardanoAddress = (
  address: string | undefined,
): string | undefined => {
  if (address === undefined) return undefined;
  if (address.length < 20) {
    return address;
  }
  let firstPartEndIndex = 9;
  if (address.indexOf("test") >= 0) firstPartEndIndex += 5;
  const firstPart = address.substring(0, firstPartEndIndex);
  const lastPart = address.substring(address.length - 4, address.length);
  return `${firstPart}...${lastPart}`;
};
