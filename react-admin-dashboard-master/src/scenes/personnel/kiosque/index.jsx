import React, { useState, useEffect, useRef } from "react";
import { 
  Box, Typography, Paper, Stack, CircularProgress, 
  Avatar, alpha, Container, Divider, TextField, useTheme 
} from "@mui/material";
import { 
  Fingerprint, VerifiedUser, ErrorOutline, 
  SettingsInputAntenna, AccessTime, FaceRetouchingNatural
} from "@mui/icons-material";
import { motion, AnimatePresence } from "framer-motion";
import Webcam from "react-webcam";
import api from "../../../api"; // Ton instance Axios

// --- IMAGES ---
import sceauRdc from "../../../assets/gouvernement rdc.png"; 
import drapeauRdc from "../../../assets/rdc.png";

// --- COULEURS OFFICIELLES RDC ---
const RDC_BLUE = "#007FFF"; 
const RDC_YELLOW = "#F7D618"; 
const RDC_RED = "#CE1126"; 

const KiosquePointageHighTech = () => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  
  const webcamRef = useRef(null);
  const [time, setTime] = useState(new Date());
  const [status, setStatus] = useState("IDLE"); 
  const [agentData, setAgentData] = useState(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [matricule, setMatricule] = useState("");

  // Horloge en temps réel
  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const handlePointage = async () => {
    if (status !== "IDLE" || !matricule) return;
    setStatus("SCANNING");
    
    try {
      // 1. Capture de l'image faciale
      const imageSrc = webcamRef.current.getScreenshot();
      if (!imageSrc) throw new Error("Caméra introuvable");

      // 2. Conversion Base64 -> Fichier
      const fetchRes = await fetch(imageSrc);
      const blob = await fetchRes.blob();
      const file = new File([blob], "capture.jpg", { type: "image/jpeg" });

      // 3. Préparation des données (Multipart)
      const formData = new FormData();
      formData.append("matricule", matricule.toUpperCase());
      formData.append("image", file);

      // 4. Appel API (Le backend gère la reconnaissance faciale)
      const response = await api.post("/pointages/scanner/", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      
      setAgentData(response.data);
      setStatus("SUCCESS");
      
      // Reset après 5 secondes
      setTimeout(() => {
        setStatus("IDLE");
        setAgentData(null);
        setMatricule("");
      }, 5000);

    } catch (err) {
      setErrorMsg(err.response?.data?.error || "ÉCHEC D'AUTHENTIFICATION BIOMÉTRIQUE");
      setStatus("ERROR");
      setTimeout(() => setStatus("IDLE"), 4000);
    }
  };

  // --- STYLES DYNAMIQUES (DARK/LIGHT) ---
  const bgGradient = isDark 
    ? `radial-gradient(circle at 50% 50%, #001a33 0%, #000810 100%)`
    : `radial-gradient(circle at 50% 50%, #ffffff 0%, #e3f2fd 100%)`;
    
  const textColor = isDark ? "#fff" : "#001a33";
  const gridOpacity = isDark ? 0.05 : 0.1;

  return (
    <Box sx={{ 
      width: "100%",
      minHeight: "85vh", 
      borderRadius: "20px",
      background: bgGradient,
      color: textColor, 
      overflow: "hidden", 
      position: "relative",
      border: `1px solid ${alpha(RDC_BLUE, 0.2)}`,
      boxShadow: isDark ? "0 10px 30px rgba(0,0,0,0.5)" : "0 10px 30px rgba(0,127,255,0.1)"
    }}>
      
      {/* BANNIÈRE SUPÉRIEURE (DRAPEAU DYNAMIQUE) */}
      <Box sx={{ position: "absolute", top: 0, left: 0, width: "100%", height: "4px", display: "flex", zIndex: 10 }}>
        <Box sx={{ flex: 4, bgcolor: RDC_BLUE }} />
        <Box sx={{ flex: 0.5, bgcolor: RDC_YELLOW }} />
        <Box sx={{ flex: 1, bgcolor: RDC_RED }} />
      </Box>

      {/* GRID DE FOND FUTURISTE */}
      <Box sx={{
        position: "absolute", width: "100%", height: "100%",
        opacity: gridOpacity, pointerEvents: "none",
        backgroundImage: `linear-gradient(${RDC_BLUE} 1px, transparent 1px), linear-gradient(90deg, ${RDC_BLUE} 1px, transparent 1px)`,
        backgroundSize: "40px 40px"
      }} />

      <Container maxWidth="md" sx={{ height: "100%", display: "flex", flexDirection: "column", alignItems: "center", pt: 4, pb: 2, position: "relative", zIndex: 2 }}>
        
        {/* EN-TÊTE INSTITUTIONNEL */}
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ width: "100%", mb: 4 }}>
          <Stack direction="row" spacing={2} alignItems="center">
            <Box component="img" src={sceauRdc} sx={{ height: 60, filter: isDark ? "drop-shadow(0 0 10px rgba(247, 214, 24, 0.4))" : "none" }} />
            <Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 900, color: isDark ? RDC_YELLOW : RDC_BLUE, letterSpacing: 1 }}>
                RÉPUBLIQUE DÉMOCRATIQUE DU CONGO
              </Typography>
              <Typography variant="caption" sx={{ opacity: 0.8, display: "block", color: isDark ? RDC_BLUE : "#000", fontWeight: 700 }}>
                SYSTÈME INTÉGRÉ DE SÉCURITÉ PÉNITENTIAIRE
              </Typography>
            </Box>
          </Stack>

          <Box sx={{ textAlign: "right" }}>
            <Stack direction="row" spacing={1} alignItems="center" justifyContent="flex-end">
                <AccessTime sx={{ fontSize: 20, color: RDC_BLUE }} />
                <Typography variant="h4" sx={{ fontWeight: 900, fontFamily: 'monospace', color: textColor }}>
                {time.toLocaleTimeString("fr-FR", { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </Typography>
            </Stack>
            <Typography variant="caption" sx={{ color: isDark ? RDC_YELLOW : RDC_RED, fontWeight: 700 }}>
              {time.toLocaleDateString("fr-FR", { weekday: 'short', day: 'numeric', month: 'long', year: 'numeric' }).toUpperCase()}
            </Typography>
          </Box>
        </Stack>

        {/* ZONE DE SCANNER & FORMULAIRE */}
        <Box sx={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", width: "100%" }}>
          <AnimatePresence mode="wait">
            
            {status === "IDLE" && (
              <motion.div key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, scale: 0.9 }} style={{ width: "100%" }}>
                <Stack direction="row" spacing={6} alignItems="center" justifyContent="center">
                  
                  {/* GAUCHE : Webcam Faciale */}
                  <Stack alignItems="center" spacing={2}>
                    <Box sx={{ position: "relative", width: 260, height: 260, borderRadius: "16px", overflow: "hidden", border: `3px solid ${RDC_BLUE}`, boxShadow: `0 0 20px ${alpha(RDC_BLUE, 0.3)}` }}>
                      {/* Cible HUD */}
                      <Box sx={{ position: "absolute", top: "15%", left: "15%", width: "70%", height: "70%", border: `2px dashed ${alpha(RDC_YELLOW, 0.5)}`, zIndex: 5, pointerEvents: "none" }} />
                      
                      <Webcam
                        audio={false}
                        ref={webcamRef}
                        screenshotFormat="image/jpeg"
                        videoConstraints={{ width: 260, height: 260, facingMode: "user" }}
                        style={{ width: "100%", height: "100%", objectFit: "cover" }}
                      />
                      <Box sx={{ position: "absolute", bottom: 5, left: 0, width: "100%", textAlign: "center", zIndex: 5 }}>
                        <Typography variant="caption" sx={{ color: "#fff", bgcolor: alpha(RDC_BLUE, 0.8), px: 2, py: 0.5, borderRadius: "10px", fontWeight: 700 }}>
                          <FaceRetouchingNatural sx={{ fontSize: 14, verticalAlign: "middle", mr: 0.5 }} /> FOCUS VISAGE
                        </Typography>
                      </Box>
                    </Box>

                    <TextField 
                      fullWidth
                      variant="outlined"
                      placeholder="ENTREZ LE MATRICULE"
                      value={matricule}
                      onChange={(e) => setMatricule(e.target.value.toUpperCase())}
                      InputProps={{
                        sx: { 
                          color: textColor, fontWeight: 900, textAlign: "center", letterSpacing: 2,
                          bgcolor: isDark ? alpha("#fff", 0.05) : alpha("#000", 0.02),
                          "& fieldset": { borderColor: alpha(RDC_BLUE, 0.5) },
                          "&:hover fieldset": { borderColor: RDC_BLUE },
                          "&.Mui-focused fieldset": { borderColor: RDC_YELLOW, borderWidth: 2 }
                        }
                      }}
                      inputProps={{ style: { textAlign: 'center' } }}
                    />
                  </Stack>

                  {/* DROITE : Simulation Empreinte (Bouton d'action) */}
                  <Stack alignItems="center">
                    <Box 
                      onClick={handlePointage}
                      sx={{ 
                          position: "relative", width: 200, height: 200, 
                          display: "flex", alignItems: "center", justifyContent: "center",
                          cursor: matricule ? "pointer" : "not-allowed", mb: 2,
                          opacity: matricule ? 1 : 0.4, transition: "0.3s"
                      }}
                    >
                        {/* Cercles HUD animés */}
                        <Box sx={{ position: "absolute", width: "110%", height: "110%", borderRadius: "50%", border: `1px solid ${alpha(RDC_BLUE, 0.4)}`, animation: "spin 15s linear infinite" }} />
                        <Box sx={{ position: "absolute", width: "100%", height: "100%", borderRadius: "50%", border: `2px dashed ${alpha(RDC_YELLOW, 0.5)}`, animation: "spin 10s linear reverse infinite" }} />
                        
                        <Box sx={{ 
                            width: 140, height: 140, borderRadius: "50%",
                            bgcolor: isDark ? alpha(RDC_BLUE, 0.1) : alpha(RDC_BLUE, 0.05), 
                            border: `2px solid ${matricule ? RDC_BLUE : "gray"}`,
                            display: "flex", alignItems: "center", justifyContent: "center",
                            boxShadow: matricule ? `0 0 30px ${alpha(RDC_BLUE, 0.4)}` : "none",
                            transition: "0.4s",
                            "&:hover": { boxShadow: matricule ? `0 0 50px ${alpha(RDC_YELLOW, 0.6)}` : "none", transform: matricule ? "scale(1.05)" : "none" }
                        }}>
                            <Fingerprint sx={{ fontSize: 70, color: matricule ? RDC_BLUE : "gray" }} />
                            {matricule && <Box className="laser" />}
                        </Box>
                    </Box>
                    <Typography variant="button" sx={{ letterSpacing: 2, fontWeight: 800, color: matricule ? RDC_BLUE : "gray" }}>
                        {matricule ? "VALIDER L'IDENTITÉ" : "SAISIR MATRICULE"}
                    </Typography>
                  </Stack>

                </Stack>
              </motion.div>
            )}

            {status === "SCANNING" && (
              <Stack key="scanning" alignItems="center" spacing={4}>
                <Box sx={{ position: "relative" }}>
                   <CircularProgress size={100} sx={{ color: RDC_BLUE }} thickness={1} />
                   <CircularProgress size={80} sx={{ color: RDC_YELLOW, position: "absolute", top: 10, left: 10 }} thickness={2} />
                   <FaceRetouchingNatural sx={{ fontSize: 40, color: textColor, position: "absolute", top: 30, left: 30 }} className="blink" />
                </Box>
                <Typography variant="h6" sx={{ letterSpacing: 4, color: isDark ? RDC_YELLOW : RDC_BLUE, fontWeight: 900 }} className="blink">
                  ANALYSE BIOMÉTRIQUE EN COURS...
                </Typography>
              </Stack>
            )}

            {status === "SUCCESS" && agentData && (
              <motion.div key="success" initial={{ y: 20, scale: 0.9, opacity: 0 }} animate={{ y: 0, scale: 1, opacity: 1 }}>
                <Paper elevation={isDark ? 0 : 4} sx={{ 
                  p: 4, borderRadius: "20px", width: 550,
                  bgcolor: isDark ? alpha("#000", 0.7) : "#fff", 
                  backdropFilter: "blur(20px)",
                  border: `2px solid ${alpha("#4caf50", 0.8)}`,
                  boxShadow: "0 0 50px rgba(76, 175, 80, 0.3)"
                }}>
                  <Stack direction="row" spacing={3}>
                    <BadgeAvatar photo={agentData.photo} status="success" />
                    <Box sx={{ flex: 1 }}>
                      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
                         <Typography variant="overline" sx={{ color: "#4caf50", fontWeight: 1000, letterSpacing: 2 }}>IDENTITÉ CONFIRMÉE</Typography>
                         <Box component="img" src={drapeauRdc} sx={{ height: 16, borderRadius: "2px" }} />
                      </Stack>
                      <Typography variant="h5" sx={{ fontWeight: 900, color: textColor }}>{agentData.agent || "AGENT RDC"}</Typography>
                      <Typography variant="body2" sx={{ opacity: 0.7, mb: 2, color: textColor, fontWeight: 600 }}>{agentData.statut === "RETARD" ? "Pointage enregistré avec retard" : "Officier de Sécurité"}</Typography>
                      
                      <Divider sx={{ borderColor: alpha(textColor, 0.1), mb: 2 }} />
                      
                      <Stack direction="row" spacing={2}>
                        <InfoBox label="HEURE" value={agentData.heure} color={RDC_BLUE} textColor={textColor} />
                        <InfoBox label="STATUT" value={agentData.statut} color={agentData.statut === "RETARD" ? RDC_YELLOW : "#4caf50"} textColor={textColor} />
                      </Stack>
                    </Box>
                  </Stack>
                </Paper>
              </motion.div>
            )}

            {status === "ERROR" && (
              <motion.div key="error" initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }}>
                <Paper sx={{ p: 4, borderRadius: "20px", textAlign: "center", bgcolor: isDark ? alpha(RDC_RED, 0.1) : "#fff", border: `2px solid ${RDC_RED}`, width: 450 }}>
                  <ErrorOutline sx={{ fontSize: 80, color: RDC_RED, mb: 2 }} />
                  <Typography variant="h5" fontWeight={900} color={RDC_RED} gutterBottom>ACCÈS REFUSÉ</Typography>
                  <Typography variant="body1" sx={{ color: textColor, fontWeight: 600 }}>{errorMsg}</Typography>
                </Paper>
              </motion.div>
            )}
          </AnimatePresence>
        </Box>

        {/* PIED DE PAGE TERMINAL */}
        <Stack direction="row" justifyContent="space-between" sx={{ width: "100%", mt: 4, pt: 2, borderTop: `1px solid ${alpha(RDC_BLUE, 0.2)}` }}>
           <Stack direction="row" spacing={1} alignItems="center" sx={{ opacity: 0.7 }}>
              <SettingsInputAntenna sx={{ fontSize: 16, color: RDC_BLUE }} className="blink" />
              <Typography sx={{ fontSize: "11px", letterSpacing: 1, fontWeight: 700 }}>CONNEXION SÉCURISÉE • TERMINAL_BIO_01</Typography>
           </Stack>
           <Typography sx={{ fontSize: "10px", opacity: 0.5, fontWeight: 700 }}>© {new Date().getFullYear()} GOUVERNEMENT RDC - MINISTÈRE DE LA JUSTICE</Typography>
        </Stack>

      </Container>

      {/* ANIMATIONS CSS */}
      <style>
        {`
          @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
          .laser {
            position: absolute; width: 100%; height: 3px; background: ${RDC_YELLOW};
            box-shadow: 0 0 15px ${RDC_YELLOW}; top: 0; left: 0;
            animation: scanLine 2s ease-in-out infinite;
          }
          @keyframes scanLine { 0%, 100% { top: 10%; } 50% { top: 90%; } }
          .blink { animation: blink 1.5s infinite; }
          @keyframes blink { 0%, 100% { opacity: 1; } 50% { opacity: 0.3; } }
        `}
      </style>
    </Box>
  );
};

// --- COMPOSANTS DE SOUTIEN ---

const BadgeAvatar = ({ photo, status }) => (
  <Box sx={{ position: "relative" }}>
    <Avatar 
        src={photo || "/placeholder-avatar.jpg"} 
        variant="rounded"
        sx={{ 
            width: 120, height: 140, borderRadius: "12px", 
            border: `3px solid ${status === 'success' ? '#4caf50' : RDC_BLUE}` 
        }} 
    />
    <Box sx={{ 
        position: "absolute", bottom: -12, right: -12, 
        bgcolor: status === 'success' ? "#4caf50" : RDC_RED,
        borderRadius: "50%", p: 0.5, display: "flex", border: "4px solid transparent"
    }}>
        <VerifiedUser sx={{ fontSize: 24, color: "#fff" }} />
    </Box>
  </Box>
);

const InfoBox = ({ label, value, color, textColor }) => (
  <Box sx={{ p: 1.5, bgcolor: alpha(color, 0.1), borderRadius: "10px", flex: 1, borderLeft: `4px solid ${color}` }}>
    <Typography variant="caption" sx={{ color: color, fontWeight: 900, fontSize: "10px", letterSpacing: 1 }}>{label}</Typography>
    <Typography variant="h6" sx={{ fontSize: "16px", fontWeight: 900, color: textColor }}>{value}</Typography>
  </Box>
);

export default KiosquePointageHighTech;