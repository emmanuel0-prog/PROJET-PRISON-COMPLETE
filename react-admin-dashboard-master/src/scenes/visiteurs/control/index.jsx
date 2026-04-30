import React, { useState, useEffect } from "react";
import {
  Box, Typography, Button, Grid, Stack, Paper, alpha, 
  Alert, Fade, Divider, Avatar, Chip, TextField, Dialog, DialogContent, 
  DialogTitle, IconButton, DialogActions, useTheme, LinearProgress
} from "@mui/material";
import {
  PersonSearch, Print, Videocam, GppGood, Security
} from "@mui/icons-material";
import axios from "axios";
import { Html5QrcodeScanner } from "html5-qrcode";
import { QRCodeSVG } from "qrcode.react";
import api from "../../../api"; // ✅ API CENTRALISÉE

// PALETTE HIGH-TECH RDC
const RDC_BLUE = "#007FFF";
const RDC_YELLOW = "#F7D618";
const RDC_RED = "#CE1021";
const RDC_DARK_DEEP = "#000A14";

// ASSETS (Assurez-vous que les chemins sont corrects dans votre projet)
import sceauRdc from "../../../assets/gouvernement rdc.png"; 
import drapeauRdc from "../../../assets/rdc.png"; 

const InterfaceControleAgent = () => {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";

  const [scanValue, setScanValue] = useState("");
  const [visiteur, setVisiteur] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [scannerOpen, setScannerOpen] = useState(false);
  const [showBadge, setShowBadge] = useState(false);

  // --- LOGIQUE SCANNER QR ---
  useEffect(() => {
    let scanner = null;
    if (scannerOpen) {
      const timer = setTimeout(() => {
        const element = document.getElementById("reader");
        if (element) {
          scanner = new Html5QrcodeScanner("reader", { 
            fps: 20, 
            qrbox: { width: 250, height: 250 } 
          });
          scanner.render((result) => {
            setScanValue(result);
            setScannerOpen(false);
            handleVerify(result);
            scanner.clear();
          }, (err) => {});
        }
      }, 350);
      return () => clearTimeout(timer);
    }
    return () => { if (scanner) scanner.clear(); };
  }, [scannerOpen]);

  const handleVerify = async (manualValue = null) => {
    const val = manualValue || scanValue;
    if (!val) return;
    setLoading(true);
    setError(null);
    try {
      const cleanId = val.toUpperCase().replace("VISIT-", "").trim();
      const res = await api.get(`/visiteurs/${cleanId}/`);
      setVisiteur(res.data);
    } catch (err) {
      setError("ACCÈS REFUSÉ : Identité introuvable dans le registre central.");
      setVisiteur(null);
    } finally {
      setLoading(false);
    }
  };

  const handleFinalDecision = async (statut) => {
    try {
      await api.patch(`/visiteurs/${visiteur.id}/valider-entree/`, { statut });
      if (statut === 'AUTORISE') setShowBadge(true);
      else { resetInterface(); alert("ACCÈS RÉVOQUÉ - SYSTÈME VERROUILLÉ"); }
    } catch (err) { alert("Erreur de liaison satellite."); }
  };

  const resetInterface = () => { setVisiteur(null); setScanValue(""); setShowBadge(false); };
  
  const handlePrint = () => {
    window.print();
  };

  const surfaceColor = isDark ? alpha("#fff", 0.03) : alpha(RDC_BLUE, 0.05);
  const borderColor = isDark ? alpha(RDC_BLUE, 0.3) : alpha(RDC_BLUE, 0.2);
  const mainBg = isDark ? RDC_DARK_DEEP : "#F4F7F9";
  const textColor = isDark ? "#E0E0E0" : "#1A2027";

  return (
    <Box sx={{ p: 3, bgcolor: mainBg, minHeight: "100vh", color: textColor }}>
      
      {/* HEADER PRINCIPAL */}
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: `2px solid ${borderColor}`, pb: 2, mb: 4 }}>
        <Stack direction="row" spacing={2} alignItems="center">
           <Avatar src={sceauRdc} sx={{ width: 65, height: 65, border: `2px solid ${RDC_BLUE}`, p: 0.5, bgcolor: "#fff" }} />
           <Box>
              <Typography variant="h5" sx={{ fontWeight: 900, color: isDark ? "#fff" : RDC_BLUE }}>
                MINISTÈRE DE LA JUSTICE ET GARDE DES SCEAUX <span style={{ color: isDark ? RDC_BLUE : RDC_RED }}>• RDC</span>
              </Typography>
              <Typography variant="caption" sx={{ color: isDark ? alpha("#fff", 0.6) : "#555", fontWeight: 700, display: "flex", alignItems: "center", gap: 1 }}>
                <Box sx={{ width: 8, height: 8, bgcolor: "#00ff00", borderRadius: "50%", boxShadow: "0 0 10px #00ff00" }} />
                SYSTÈME BIOMÉTRIQUE CENTRALISÉ • TERMINAL-04
              </Typography>
           </Box>
        </Stack>
        <Security sx={{ fontSize: 40, color: alpha(RDC_BLUE, 0.5) }} />
      </Box>

      {loading && <LinearProgress sx={{ mb: 2 }} />}

      <Grid container spacing={3}>
        {/* MODULE DE SCAN */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, bgcolor: surfaceColor, border: `1px solid ${borderColor}`, borderRadius: "20px", position: "relative", overflow: "hidden" }}>
            <Box sx={{ position: "absolute", top: 0, left: 0, width: "100%", height: "4px", bgcolor: RDC_BLUE }} />
            <Typography variant="overline" sx={{ color: RDC_BLUE, fontWeight: 900 }}>Module d'Identification</Typography>
            
            <TextField 
              fullWidth placeholder="SCAN ID VISITEUR" value={scanValue}
              onChange={(e) => setScanValue(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleVerify()}
              sx={{ mt: 2, bgcolor: isDark ? "rgba(0,0,0,0.5)" : "#fff", borderRadius: "8px" }}
            />
            
            <Stack spacing={2} mt={3}>
              <Button fullWidth variant="contained" onClick={() => handleVerify()} sx={{ bgcolor: RDC_BLUE, height: 55, fontWeight: 900 }}>
                INTERROGER LA BASE
              </Button>
              <Button fullWidth startIcon={<Videocam />} onClick={() => setScannerOpen(true)} sx={{ border: `1px solid ${RDC_YELLOW}`, color: isDark ? RDC_YELLOW : "#B8860B", height: 55, fontWeight: 900 }}>
                CAMERA QR
              </Button>
            </Stack>
          </Paper>
          {error && <Alert severity="error" sx={{ mt: 2, borderRadius: "12px" }}>{error}</Alert>}
        </Grid>

        {/* AFFICHAGE RÉSULTATS */}
        <Grid item xs={12} md={8}>
          {!visiteur ? (
            <Box sx={{ height: 400, border: `2px dashed ${borderColor}`, borderRadius: "20px", display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", opacity: 0.6 }}>
                <PersonSearch sx={{ fontSize: 80, color: RDC_BLUE, mb: 2 }} />
                <Typography variant="h6">PRÊT POUR IDENTIFICATION</Typography>
            </Box>
          ) : (
            <Fade in>
              <Paper sx={{ p: 4, bgcolor: surfaceColor, border: `1px solid ${borderColor}`, borderRadius: "20px" }}>
                <Grid container spacing={4}>
                   <Grid item xs={12} md={5}>
                      <Box sx={{ position: "relative", borderRadius: "12px", overflow: "hidden", border: `3px solid ${RDC_BLUE}` }}>
                          <img src={visiteur.photo_capturee} style={{ width: '100%', height: 350, objectFit: 'cover' }} alt="Bio" />
                          <Box className="scan-line" />
                      </Box>
                   </Grid>
                   <Grid item xs={12} md={7}>
                      <Typography variant="h3" sx={{ fontWeight: 900, mb: 1 }}>{visiteur.nom_complet}</Typography>
                      <Stack direction="row" spacing={1} mb={3}>
                        <Chip label="VÉRIFIÉ" sx={{ bgcolor: "#2e7d32", color: "#fff", fontWeight: 900 }} />
                        <Chip label={visiteur.type_visiteur} variant="outlined" sx={{ color: RDC_YELLOW, borderColor: RDC_YELLOW }} />
                      </Stack>
                      <Box sx={{ p: 3, bgcolor: isDark ? "rgba(0,0,0,0.3)" : "#fff", borderRadius: "15px", borderLeft: `6px solid ${RDC_YELLOW}` }}>
                        <Typography variant="caption">N° PIÈCE D'IDENTITÉ</Typography>
                        <Typography variant="h5" sx={{ mb: 2, fontWeight: 800 }}>{visiteur.piece_identite_numero}</Typography>
                        <Typography variant="caption">DESTINATION :</Typography>
                        <Typography variant="h6" sx={{ color: RDC_BLUE }}>PAVILLON {visiteur.pavillon || "A-01"} • DÉTENU : {visiteur.detenu_details?.nom}</Typography>
                      </Box>
                      <Stack direction="row" spacing={2} mt={4}>
                         <Button fullWidth variant="contained" sx={{ bgcolor: RDC_RED }} onClick={() => handleFinalDecision('REFUSE')}>ACCÈS REFUSÉ</Button>
                         <Button fullWidth variant="contained" sx={{ bgcolor: "#2e7d32" }} onClick={() => handleFinalDecision('AUTORISE')}>VALIDER ENTRÉE</Button>
                      </Stack>
                   </Grid>
                </Grid>
              </Paper>
            </Fade>
          )}
        </Grid>
      </Grid>

      {/* DIALOG SCANNER */}
      <Dialog open={scannerOpen} onClose={() => setScannerOpen(false)} maxWidth="xs" fullWidth>
        <Box sx={{ bgcolor: RDC_DARK_DEEP, p: 2, textAlign: "center", color: "#fff", borderBottom: `2px solid ${RDC_BLUE}` }}>CAPTEUR QR</Box>
        <DialogContent sx={{ bgcolor: "#000", p: 0 }}><div id="reader"></div></DialogContent>
      </Dialog>

      {/* --- DIALOG DE LA CARTE (OPTIMISÉ POUR L'IMPRESSION) --- */}
      <Dialog open={showBadge} onClose={resetInterface} maxWidth="sm" PaperProps={{ sx: { borderRadius: "20px" } }}>
        <DialogContent sx={{ p: 0 }}>
          {/* LE CONTENEUR DE LA CARTE */}
          <Box id="printable-badge" sx={{ 
            width: "600px", // Légèrement plus large pour l'impression
            height: "380px", 
            bgcolor: "#fff", 
            color: "#000",
            position: "relative", 
            p: 3, 
            boxSizing: "border-box",
            display: "flex",
            flexDirection: "column",
            backgroundImage: `linear-gradient(rgba(255,255,255,0.94), rgba(255,255,255,0.94)), url(${drapeauRdc})`,
            backgroundSize: 'cover', 
            backgroundPosition: 'center',
            border: "1px solid #000"
          }}>
            
            {/* HEADER CARTE */}
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
              <img src={sceauRdc} alt="Sceau" style={{ width: 60, height: "auto" }} />
              <Box sx={{ textAlign: "center" }}>
                <Typography sx={{ fontWeight: 900, color: RDC_RED, fontSize: '12px', lineHeight: 1.1 }}>RÉPUBLIQUE DÉMOCRATIQUE DU CONGO</Typography>
                <Typography sx={{ color: RDC_BLUE, fontWeight: 900, fontSize: '10px' }}>MINISTÈRE DE LA JUSTICE ET GARDE DES SCEAUX</Typography>
                <Typography sx={{ fontWeight: 700, fontSize: '9px' }}>DIRECTION GÉNÉRALE DES PRISONS</Typography>
              </Box>
              <img src={drapeauRdc} alt="Drapeau" style={{ width: 50, height: "auto", border: "1px solid #eee" }} />
            </Box>

            <Box sx={{ bgcolor: RDC_BLUE, color: '#fff', textAlign: 'center', py: 0.8, mb: 2, borderRadius: "4px" }}>
              <Typography sx={{ fontWeight: 900, letterSpacing: 2, fontSize: '13px' }}>CARTE D'ACCÈS VISITEUR SÉCURISÉE</Typography>
            </Box>

            {/* CORPS CARTE */}
            <Grid container spacing={2} sx={{ flexGrow: 1 }}>
              <Grid item xs={4}>
                <Box sx={{ border: '2px solid #000', height: 150, width: "100%", bgcolor: '#eee', overflow: 'hidden' }}>
                  <img src={visiteur?.photo_capturee} alt="Photo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </Box>
                <Typography sx={{ fontWeight: 900, color: RDC_RED, mt: 1, textAlign: 'center', fontSize: '12px' }}>ID: {visiteur?.id}</Typography>
              </Grid>
              
              <Grid item xs={5}>
                <Stack spacing={1.5}>
                  <Box>
                    <Typography sx={{ fontSize: '9px', color: '#555', fontWeight: 700 }}>NOM COMPLET</Typography>
                    <Typography sx={{ fontWeight: 900, fontSize: '16px', textTransform: 'uppercase', lineHeight: 1.1 }}>{visiteur?.nom_complet}</Typography>
                  </Box>
                  <Box>
                    <Typography sx={{ fontSize: '9px', color: '#555', fontWeight: 700 }}>N° PIÈCE D'IDENTITÉ</Typography>
                    <Typography sx={{ fontWeight: 800, fontSize: '13px' }}>{visiteur?.piece_identite_numero}</Typography>
                  </Box>
                  <Box sx={{ bgcolor: alpha(RDC_YELLOW, 0.2), p: 1, borderLeft: '4px solid #F7D618', borderRadius: "0 4px 4px 0" }}>
                    <Typography sx={{ fontSize: '9px', fontWeight: 900 }}>DÉTENU À VISITER :</Typography>
                    <Typography sx={{ fontWeight: 900, fontSize: '11px' }}>{visiteur?.detenu_details?.nom}</Typography>
                  </Box>
                </Stack>
              </Grid>

              <Grid item xs={3} sx={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                <Box sx={{ p: 1, bgcolor: "#fff", border: "1px solid #ddd" }}>
                  <QRCodeSVG value={`VERIF-${visiteur?.id}`} size={100} level="H" />
                </Box>
                <Typography sx={{ fontSize: '8px', mt: 1, fontWeight: 700, textAlign: 'center' }}>VÉRIFICATION<br/>BIOMÉTRIQUE</Typography>
              </Grid>
            </Grid>

            {/* FOOTER CARTE */}
            <Box sx={{ mt: 2, pt: 1, borderTop: '1px solid #000', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
               <Box>
                 <Typography sx={{ fontSize: '8px', fontStyle: 'italic', maxWidth: '350px', lineHeight: 1.2 }}>
                   Ce document est la propriété du Ministère de la Justice. Toute falsification est passible de poursuites judiciaires.
                 </Typography>
               </Box>
               <Box sx={{ textAlign: "right" }}>
                 <Typography sx={{ fontFamily: 'monospace', fontWeight: 900, fontSize: '14px', color: RDC_BLUE }}>
                   {visiteur?.id?.toString().padStart(8, '0')}
                 </Typography>
                 <Typography sx={{ fontSize: '7px', fontWeight: 900 }}>CARD SERIAL NUMBER</Typography>
               </Box>
            </Box>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2, bgcolor: isDark ? RDC_DARK_DEEP : '#f5f5f5' }}>
          <Button fullWidth variant="contained" startIcon={<Print />} onClick={handlePrint} sx={{ bgcolor: RDC_BLUE, fontWeight: 900, height: 50 }}>
            LANCER L'IMPRESSION DU BADGE
          </Button>
        </DialogActions>
      </Dialog>

      {/* CSS GLOBAL ET PRINT */}
      <style>
        {`
          /* Animation de Scan */
          .scan-line {
            position: absolute; top: 0; left: 0; width: 100%; height: 4px;
            background: ${RDC_BLUE}; box-shadow: 0 0 15px ${RDC_BLUE};
            animation: scan 3s linear infinite; z-index: 10;
          }
          @keyframes scan { 0% { top: 0; } 50% { top: 100%; } 100% { top: 0; } }

          /* LOGIQUE D'IMPRESSION CRITIQUE */
          @media print {
            /* On cache TOUT sauf la carte */
            body * {
              visibility: hidden;
              margin: 0;
            }
            
            #printable-badge, #printable-badge * {
              visibility: visible;
            }

            #printable-badge {
              position: fixed;
              left: 50%;
              top: 50%;
              transform: translate(-50%, -50%); /* Centre la carte sur la page A4 */
              width: 600px !important;
              height: 380px !important;
              border: 1px solid #000 !important;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
              background-color: white !important;
            }

            /* On supprime les marges de page imposées par le navigateur */
            @page {
              margin: 0;
              size: auto;
            }
          }
        `}
      </style>
    </Box>
  );
};

export default InterfaceControleAgent;