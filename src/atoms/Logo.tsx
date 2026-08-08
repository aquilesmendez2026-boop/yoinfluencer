import { HStack, Text, type StackProps } from "@chakra-ui/react";
import { PinaLogo } from "./Pina";

interface LogoProps extends Omit<StackProps, "fontSize"> {
  fontSize?: StackProps["fontSize"];
  /** Oculta la piña y deja solo el texto. */
  soloTexto?: boolean;
}

export const Logo = ({ fontSize = "xl", soloTexto, ...props }: LogoProps) => {
  return (
    <HStack gap="0.4em" fontSize={fontSize} userSelect="none" {...props}>
      {!soloTexto && <PinaLogo size="1.15em" />}
      <Text
        as="span"
        fontFamily="heading"
        fontWeight="900"
        letterSpacing="tight"
        lineHeight="1"
      >
        <Text as="span" color="brand.400">modo</Text>
        <Text as="span" color="accent.gold">piña</Text>
      </Text>
    </HStack>
  );
};
