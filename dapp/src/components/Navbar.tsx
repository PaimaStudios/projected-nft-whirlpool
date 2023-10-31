import { AppBar, Button, Container, Stack, Toolbar } from "@mui/material";
import { Link } from "react-router-dom";
import ConnectWallet from "./ConnectWallet";

export default function Navbar() {
  return (
    <>
      <AppBar sx={{ bgcolor: "#030909" }}>
        <Container>
          <Toolbar sx={{ gap: 2 }}>
            <Link to="/">
              <Button variant="text">Projected NFT Whirlpool</Button>
            </Link>
            <Stack sx={{ flexGrow: 1 }} />
            <ConnectWallet />
          </Toolbar>
        </Container>
      </AppBar>
      <Toolbar />
    </>
  );
}
