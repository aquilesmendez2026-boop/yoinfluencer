import { HStack, Text, type StackProps } from "@chakra-ui/react";
import { PinaLogo } from "./Pina";

interface LogoProps extends Omit<StackProps, "fontSize"> {
  fontSize?: StackProps["fontSize"];
  /** Oculta la piña y deja solo el wordmark. */
  soloTexto?: boolean;
}

const wordSx = {
  fontFamily: "heading",
  fontWeight: "900",
  letterSpacing: "0.06em",
  lineHeight: "1",
} as const;

export const Logo = ({ fontSize = "xl", soloTexto, ...props }: LogoProps) => {
  return (
    <HStack gap="0.35em" fontSize={fontSize} userSelect="none" {...props}>
      <Text
        as="span"
        {...wordSx}
        color="brand.400"
        textShadow="0 0 8px rgba(59, 224, 129, 0.55)"
      >
        MODO
      </Text>
      {!soloTexto && <PinaLogo size="1.7em" neon />}
      <Text
        as="span"
        {...wordSx}
        color="accent.gold"
        textShadow="0 0 8px rgba(245, 197, 24, 0.5)"
      >
        PIÑA
      </Text>
    </HStack>
  );
};
