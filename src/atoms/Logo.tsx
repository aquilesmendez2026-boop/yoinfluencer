import { Text, type TextProps } from "@chakra-ui/react";

export const Logo = (props: TextProps) => {
  return (
    <Text
      as="span"
      fontFamily="heading"
      fontWeight="900"
      letterSpacing="tight"
      lineHeight="1"
      backgroundImage="linear-gradient(135deg, #22d3ee 0%, #d946ef 100%)"
      backgroundClip="text"
      color="transparent"
      userSelect="none"
      {...props}
    >
      NI TAN MAL
    </Text>
  );
};
