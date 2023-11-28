import { createTheme } from "@mui/material/styles";

export const theme = createTheme({
  palette: {
    mode: "dark",
    primary: { main: "#19b17b" },
    secondary: { main: "#fff" },
    background: { default: "#030909" },
  },
  typography: {
    fontFamily: '"Inter", sans-serif',
    /*...font.style,*/ h1: { fontWeight: 800 },
    button: { fontWeight: 600 },
  },
  components: {
    MuiPaper: {
      styleOverrides: {
        outlined: ({ theme }) =>
          theme.unstable_sx({
            backgroundColor: theme.palette.primary.main,
          }),
      },
    },
  },
});
