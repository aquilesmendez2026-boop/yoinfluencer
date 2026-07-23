import { Text, type TextProps } from "@chakra-ui/react";

export const Logo = (props: TextProps) => {
  return (
    <Text
      as="span"
      fontFamily="heading"
      fontWeight="900"
      letterSpacing="tight"
      lineHeight="1"
      backgroundImage="linear-gradient(135deg, #6ce9a6 0%, #12b76a 100%)"
      backgroundClip="text"
      color="transparent"
      userSelect="none"
      {...props}
    >
      YO INFLUENCER
    </Text>
  );
};
