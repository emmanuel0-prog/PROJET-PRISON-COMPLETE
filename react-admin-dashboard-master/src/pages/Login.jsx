import React, { useState } from "react";
import axios from "axios";
import {
  Box, TextField, Button, Typography, Paper,
  Stack, Alert, Snackbar, InputAdornment,
  CircularProgress, Fade, Slide
} from "@mui/material";

import {
  LockOutlined, PersonOutline, Shield,
  VpnKey, ArrowBack
} from "@mui/icons-material";

import sceauRdc from "../assets/gouvernement rdc.png";
import drapeauRdc from "../assets/rdc.png";

const RDC_BLUE = "#007FFF";
const RDC_YELLOW = "#F7D618";

const Login = () => {

  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);

  const [credentials, setCredentials] = useState({
    username: "",
    password: "",
    otp: ""
  });

  const [notification, setNotification] = useState({
    open: false,
    message: "",
    severity: "success"
  });

  const handleChange = (e) => {
    setCredentials({
      ...credentials,
      [e.target.name]: e.target.value
    });
  };

  // =========================
  // LOGIN
  // =========================
  const handleLogin = async () => {

    if (loading) return; // 🔥 anti double click

    setLoading(true);

    try {
      const res = await axios.post(
        "http://127.0.0.1:8000/api/users/login/",
        credentials
      );

      // =========================
      // STEP 2FA REQUIRED
      // =========================
      if (res.data.step === "2FA_REQUIRED") {
        setStep(2);

        setNotification({
          open: true,
          message: "Authentification 2FA requise",
          severity: "info"
        });

        setLoading(false);
        return;
      }

      // =========================
      // LOGIN SUCCESS
      // =========================
      if (res.data.access) {

        localStorage.setItem("access", res.data.access);
        localStorage.setItem("refresh", res.data.refresh);
        localStorage.setItem("user", JSON.stringify(res.data.user));

        setNotification({
          open: true,
          message: "Accès autorisé",
          severity: "success"
        });

        setTimeout(() => {
          window.location.href = "/";
        }, 1200);
      }

    } catch (err) {
      setNotification({
        open: true,
        message: err.response?.data?.error || "Erreur serveur",
        severity: "error"
      });
    }

    setLoading(false);
  };

  // =========================
  // RESET OTP STEP
  // =========================
  const resetStep = () => {
    setStep(1);
    setCredentials({
      ...credentials,
      otp: ""
    });
  };

  return (
    <Box sx={{
      height: "100vh",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      background: "#0a0f1d"
    }}>

      <Paper sx={{
        width: 460,
        p: 4,
        borderRadius: 3,
        textAlign: "center",
        background: "rgba(18,25,43,0.95)",
        backdropFilter: "blur(15px)"
      }}>

        {/* HEADER */}
        <Stack direction="row" justifyContent="space-between" mb={2}>

          <Box component="img"
            src={sceauRdc}
            sx={{
              width: 70,
              height: 70,
              borderRadius: "50%",
              border: `2px solid ${RDC_BLUE}`
            }}
          />

          <Box component="img"
            src={drapeauRdc}
            sx={{ width: 55, borderRadius: 1 }}
          />

        </Stack>

        <Typography fontWeight={900} color="white">
          MINISTÈRE DE LA JUSTICE - RDC
        </Typography>

        <Typography variant="caption" sx={{ color: RDC_YELLOW }}>
          SYSTÈME SÉCURISÉ NATIONAL
        </Typography>

        {/* ================= STEP 1 ================= */}
        {step === 1 && (
          <Fade in>
            <Stack spacing={2} mt={3}>

              <TextField
                name="username"
                label="Identifiant"
                value={credentials.username}
                onChange={handleChange}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <PersonOutline sx={{ color: RDC_BLUE }} />
                    </InputAdornment>
                  )
                }}
              />

              <TextField
                name="password"
                type="password"
                label="Mot de passe"
                value={credentials.password}
                onChange={handleChange}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <LockOutlined sx={{ color: RDC_BLUE }} />
                    </InputAdornment>
                  )
                }}
              />

            </Stack>
          </Fade>
        )}

        {/* ================= STEP 2 ================= */}
        {step === 2 && (
          <Slide direction="left" in>

            <Stack spacing={2} mt={3}>

              <Typography sx={{
                color: "#fff",
                bgcolor: "rgba(247,214,24,0.1)",
                p: 1,
                borderRadius: 1
              }}>
                Code OTP Google Authenticator
              </Typography>

              <TextField
                name="otp"
                label="Code OTP"
                value={credentials.otp}
                onChange={handleChange}
                inputProps={{
                  maxLength: 6,
                  style: {
                    textAlign: "center",
                    letterSpacing: 6,
                    fontWeight: "bold"
                  }
                }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <VpnKey sx={{ color: RDC_YELLOW }} />
                    </InputAdornment>
                  )
                }}
              />

            </Stack>
          </Slide>
        )}

        {/* BUTTON */}
        <Box mt={4}>

          <Button
            fullWidth
            onClick={handleLogin}
            disabled={loading}
            sx={{
              py: 1.5,
              fontWeight: 900,
              background: `linear-gradient(90deg, ${RDC_BLUE}, #004bb5)`,
              color: "#fff"
            }}
          >
            {loading ? (
              <CircularProgress size={22} color="inherit" />
            ) : step === 1 ? (
              "SE CONNECTER"
            ) : (
              "VALIDER OTP"
            )}
          </Button>

          {step === 2 && (
            <Button
              fullWidth
              startIcon={<ArrowBack />}
              onClick={resetStep}
              sx={{ mt: 1, color: "#aaa" }}
            >
              Retour
            </Button>
          )}

        </Box>

        {/* FOOTER */}
        <Stack direction="row" justifyContent="center" mt={3}>
          <Shield sx={{ color: RDC_YELLOW, fontSize: 16 }} />
          <Typography variant="caption" color="white">
            ACCÈS SÉCURISÉ RDC
          </Typography>
        </Stack>

      </Paper>

      {/* NOTIFICATION */}
      <Snackbar
        open={notification.open}
        autoHideDuration={4000}
        onClose={() => setNotification({ ...notification, open: false })}
      >
        <Alert severity={notification.severity}>
          {notification.message}
        </Alert>
      </Snackbar>

    </Box>
  );
};

export default Login;