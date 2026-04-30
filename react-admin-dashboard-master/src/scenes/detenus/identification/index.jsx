import React, { useState, useRef, useCallback } from "react";
import {
  Box, Typography, useTheme, Button, Grid, Stack, Paper, LinearProgress, alpha, IconButton
} from "@mui/material";
import Webcam from "react-webcam";
import {
  Fingerprint, Face, PhotoCamera, Refresh, Save, PanToolOutlined, CheckCircle,
  ShieldOutlined, Sensors, ErrorOutline, AppRegistration
} from "@mui/icons-material";
import Header from "../../../components/Header";

// COULEURS OFFICIELLES RDC
const RDC_BLUE = "#007FFF";
const RDC_YELLOW = "#F7D618";
const RDC_RED = "#CE1021";

const IdentificationBiometrique = () => {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const bc = isDark ? "#fff" : "#000";
  const webcamRef = useRef(null);

  // ÉTATS
  const [capturedFingers, setCapturedFingers] = useState({
    L1: null, L2: null, L3: null, L4: null, L5: null,
    R1: null, R2: null, R3: null, R4: null, R5: null
  });
  const [capturedFace, setCapturedFace] = useState(null);
  const [isCapturing, setIsCapturing] = useState(null);

  // 1. SIMULATION DE CAPTURE (Style Futronic FS80H)
  const simulateFingerCapture = (fingerId) => {
    if (capturedFingers[fingerId]) return;
    setIsCapturing(fingerId);
    
    setTimeout(() => {
      const mockTemplate = `ANSI_378_${fingerId}_${Math.random().toString(36).toUpperCase().substring(7)}`;
      setCapturedFingers(prev => ({ ...prev, [fingerId]: mockTemplate }));
      setIsCapturing(null);
    }, 1200);
  };

  // 2. CAPTURE FACE
  const captureFace = useCallback(() => {
    const imageSrc = webcamRef.current.getScreenshot();
    setCapturedFace(imageSrc);
  }, [webcamRef]);

  const fingerCount = Object.values(capturedFingers).filter(Boolean).length;
  const progress = (fingerCount * 10);

  // COMPOSANT DOIGT (Style Interface Tactile)
  const FingerIcon = ({ id, label }) => {
    const isDone = !!capturedFingers[id];
    const active = isCapturing === id;

    return (
      <Box 
        onClick={() => simulateFingerCapture(id)}
        sx={{ 
          cursor: 'pointer',
          textAlign: 'center',
          p: 1.5,
          border: `2px solid ${isDone ? RDC_BLUE : active ? RDC_YELLOW : alpha(bc, 0.2)}`,
          bgcolor: isDone ? alpha(RDC_BLUE, 0.05) : active ? alpha(RDC_YELLOW, 0.1) : "transparent",
          transition: "0.2s",
          position: 'relative',
          "&:hover": { bgcolor: alpha(bc, 0.05), borderColor: bc }
        }}
      >
        {active ? (
            <CircularProgressRDC size={24} />
        ) : (
            <Fingerprint sx={{ fontSize: 32, color: isDone ? RDC_BLUE : alpha(bc, 0.3) }} />
        )}
        <Typography variant="caption" display="block" fontWeight={900} sx={{ mt: 0.5 }}>{label}</Typography>
        {isDone && <CheckCircle sx={{ position: 'absolute', top: 2, right: 2, fontSize: 14, color: RDC_BLUE }} />}
      </Box>
    );
  };

  return (
    <Box m="20px">
      {/* HEADER INSTITUTIONNEL RDC */}
      <Box display="flex" justifyContent="space-between" alignItems="flex-end" sx={{ borderBottom: `4px solid ${bc}`, pb: 2, mb: 4, position: "relative" }}>
        <Box sx={{ position: "absolute", bottom: -4, left: 0, width: "100%", height: "4px", display: "flex" }}>
          <Box sx={{ flex: 1, bgcolor: RDC_BLUE }} />
          <Box sx={{ flex: 1, bgcolor: RDC_YELLOW }} />
          <Box sx={{ flex: 1, bgcolor: RDC_RED }} />
        </Box>
        <Box>
          <Box display="flex" alignItems="center" gap={1} mb={1}>
            <ShieldOutlined sx={{ color: RDC_BLUE }} />
            <Typography variant="caption" fontWeight={900} sx={{ letterSpacing: "2px" }}>UNITÉ D'IDENTIFICATION CRIMINELLE</Typography>
          </Box>
          <Typography variant="h4" fontWeight={900}>ENRÔLEMENT BIOMÉTRIQUE</Typography>
          <Typography variant="body2" sx={{ opacity: 0.7, fontWeight: 700 }}>STATION DE CAPTURE N° 42-B | KINSHASA</Typography>
        </Box>
        <Box textAlign="right">
          <Typography variant="h3" fontWeight={900} color={RDC_BLUE}>{progress}%</Typography>
          <Typography variant="caption" fontWeight={900}>CONFORMITÉ</Typography>
        </Box>
      </Box>

      <Grid container spacing={3}>
        {/* SECTION GAUCHE : PORTRAIT */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 0, border: `2px solid ${bc}`, borderRadius: 0, boxShadow: "none", overflow: 'hidden' }}>
            <Box sx={{ bgcolor: bc, color: isDark ? "#000" : "#fff", p: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
              <Face fontSize="small" />
              <Typography variant="caption" fontWeight={900}>PORTRAIT JUDICIAIRE (FACE)</Typography>
            </Box>
            
            <Box sx={{ width: "100%", height: "350px", bgcolor: "#000", position: 'relative' }}>
              {!capturedFace ? (
                <Webcam
                  audio={false}
                  ref={webcamRef}
                  screenshotFormat="image/jpeg"
                  width="100%"
                  height="100%"
                  videoConstraints={{ facingMode: "user" }}
                  style={{ objectFit: "cover" }}
                />
              ) : (
                <Box component="img" src={capturedFace} sx={{ width: "100%", height: "100%", objectFit: "cover", filter: "grayscale(100%)" }} />
              )}
              {/* Overlay de visée */}
              <Box sx={{ position: 'absolute', top: '10%', left: '15%', width: '70%', height: '70%', border: `1px dashed ${alpha('#fff', 0.5)}`, pointerEvents: 'none' }} />
            </Box>

            <Stack direction="row" spacing={0} sx={{ borderTop: `2px solid ${bc}` }}>
              <Button 
                fullWidth 
                variant="contained" 
                sx={{ bgcolor: RDC_RED, color: "#fff", borderRadius: 0, fontWeight: 900, py: 2, "&:hover": { bgcolor: "#A10D1A" } }}
                startIcon={<PhotoCamera />}
                onClick={captureFace}
                disabled={!!capturedFace}
              >
                CAPTURER LE CLICHÉ
              </Button>
              {capturedFace && (
                <Button sx={{ bgcolor: bc, color: isDark ? "#000" : "#fff", borderRadius: 0, px: 3 }} onClick={() => setCapturedFace(null)}>
                  <Refresh />
                </Button>
              )}
            </Stack>
          </Paper>
        </Grid>

        {/* SECTION DROITE : EMPREINTES */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3, border: `2px solid ${bc}`, borderRadius: 0, boxShadow: "none", bgcolor: alpha(bc, 0.02) }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
              <Typography variant="h5" fontWeight={900} sx={{ textTransform: "uppercase", display: 'flex', alignItems: 'center', gap: 1 }}>
                <PanToolOutlined /> Relevé Décaphilaire
              </Typography>
              <Sensors sx={{ color: RDC_BLUE }} />
            </Box>
            
            <LinearProgress 
              variant="determinate" 
              value={progress} 
              sx={{ height: 12, mb: 4, borderRadius: 0, bgcolor: alpha(bc, 0.1), "& .MuiLinearProgress-bar": { bgcolor: RDC_BLUE } }} 
            />

            <Grid container spacing={4}>
              <Grid item xs={12} sm={6}>
                <Typography variant="caption" mb={2} display="block" fontWeight={900} sx={{ borderLeft: `4px solid ${RDC_BLUE}`, pl: 1 }}>MAIN GAUCHE</Typography>
                <Box display="grid" gridTemplateColumns="repeat(5, 1fr)" gap={1}>
                  {['L5','L4','L3','L2','L1'].map(f => <FingerIcon key={f} id={f} label={f} />)}
                </Box>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="caption" mb={2} display="block" fontWeight={900} sx={{ borderLeft: `4px solid ${RDC_BLUE}`, pl: 1 }}>MAIN DROITE</Typography>
                <Box display="grid" gridTemplateColumns="repeat(5, 1fr)" gap={1}>
                  {['R1','R2','R3','R4','R5'].map(f => <FingerIcon key={f} id={f} label={f} />)}
                </Box>
              </Grid>
            </Grid>

            <Box mt={4} p={2} sx={{ border: `1px dashed ${alpha(bc, 0.3)}`, bgcolor: alpha(bc, 0.05) }}>
              <Stack direction="row" spacing={2} alignItems="center">
                <ErrorOutline fontSize="small" sx={{ color: RDC_BLUE }} />
                <Typography variant="caption" fontWeight={700}>
                  PROTOCOL : Assurez-vous que le capteur est propre. La capture doit respecter la norme ISO/IEC 19794-4 pour être validée par le serveur central.
                </Typography>
              </Stack>
            </Box>
          </Paper>
        </Grid>

        {/* ACTIONS FINALES */}
        <Grid item xs={12}>
          <Button 
            fullWidth
            size="large"
            variant="contained" 
            disabled={progress < 100 || !capturedFace}
            sx={{ 
              bgcolor: bc, 
              color: isDark ? "#000" : "#fff",
              py: 2.5, 
              borderRadius: 0,
              fontWeight: 900,
              fontSize: "1.2rem",
              boxShadow: "none",
              "&:hover": { bgcolor: alpha(bc, 0.8) },
              "&.Mui-disabled": { bgcolor: alpha(bc, 0.1), color: alpha(bc, 0.3) }
            }}
            startIcon={<AppRegistration fontSize="large" />}
            onClick={() => {
              console.log("SYNC SERVEUR MINISTÈRE...", { face: capturedFace, fingers: capturedFingers });
              alert("DOSSIER BIOMÉTRIQUE CRYPTÉ ET ENVOYÉ.");
            }}
          >
            VALIDER ET FINALISER L'IDENTIFICATION
          </Button>
        </Grid>
      </Grid>
    </Box>
  );
};

// Loader Style RDC
const CircularProgressRDC = ({ size }) => (
    <Box sx={{ display: 'inline-block', width: size, height: size, border: '3px solid rgba(0,0,0,0.1)', borderTopColor: RDC_BLUE, borderRadius: '50%', animation: 'spin 1s linear infinite', mb: 1 }}>
        <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
    </Box>
);

export default IdentificationBiometrique;