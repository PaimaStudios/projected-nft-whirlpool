import { MuiSetup } from "./MuiSetup";
import Navbar from "./components/Navbar";
import { Providers } from "./providers";
import { Link, Outlet, Route, Routes } from "react-router-dom";
import HomePage from "./pages/HomePage";
import { Container, Stack } from "@mui/material";

export default function App() {
  return (
    <>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<HomePage />} />

          {/* Using path="*"" means "match anything", so this route
                acts like a catch-all for URLs that we don't have explicit
                routes for. */}
          <Route path="*" element={<NoMatch />} />
        </Route>
      </Routes>
    </>
  );
}

function Layout() {
  return (
    <MuiSetup>
      <Providers>
        <Navbar />
        <Outlet />
      </Providers>
    </MuiSetup>
  );
}

function NoMatch() {
  return (
    <Container>
      <Stack sx={{ alignItems: "center" }}>
        <h2>Nothing to see here!</h2>
        <p>
          <Link to="/">Go to the home page</Link>
        </p>
      </Stack>
    </Container>
  );
}
