import { ChakraProvider } from "@chakra-ui/react";
import { system } from "./theme";
import { HomePage } from "./pages/HomePage";

export const App = () => {
  return (
    <ChakraProvider value={system}>
      <HomePage />
    </ChakraProvider>
  );
};
