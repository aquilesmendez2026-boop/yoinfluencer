import { Box } from "@chakra-ui/react";
import { Navbar } from "../organisms/Navbar";
import { Hero } from "../organisms/Hero";
import { AboutSection } from "../organisms/AboutSection";
import { FormatsSection } from "../organisms/FormatsSection";
import { ScheduleSection } from "../organisms/ScheduleSection";
import { EpisodesSection } from "../organisms/EpisodesSection";
import { PlatformsSection } from "../organisms/PlatformsSection";
import { Footer } from "../organisms/Footer";
import { ProfileNudge } from "../molecules/ProfileNudge";

export const HomePage = () => {
  return (
    <Box bg="bg.canvas" color="fg.default" minH="100vh" overflowX="hidden">
      <ProfileNudge />
      <Navbar />
      <Hero />
      <AboutSection />
      <FormatsSection />
      <ScheduleSection />
      <EpisodesSection />
      <PlatformsSection />
      <Footer />
    </Box>
  );
};
