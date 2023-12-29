import { Container, Divider, Stack } from "@mui/material";
import LockNftSection from "../components/LockNftSection";
import IsConnectedWrapper from "../components/IsConnectedWrapper";
import UnlockNftSection from "../components/UnlockNftSection";

export default function HomePage() {
  return (
    <>
      <Container>
        <IsConnectedWrapper>
          <Stack
            sx={{ alignItems: "center", gap: 2, mb: 10 }}
            divider={
              <Divider orientation="horizontal" sx={{ width: "100%" }} />
            }
          >
            <LockNftSection />
            <UnlockNftSection />
          </Stack>
        </IsConnectedWrapper>
      </Container>
    </>
  );
}
