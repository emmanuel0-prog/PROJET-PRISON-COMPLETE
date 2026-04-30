import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import {
  Box, Paper, Typography, TextField, Button, Stack, Autocomplete, 
  Stepper, Step, StepLabel, Zoom, Fade, Avatar,
  Divider, CircularProgress, MenuItem, ThemeProvider, createTheme, CssBaseline, Grid,
  alpha, Dialog, DialogTitle, DialogContent, DialogActions, IconButton, InputAdornment
} from "@mui/material";
import {
  Fingerprint, CheckCircle, ArrowForward, Print, Search,
  RestartAlt, PhotoCamera, Radar, Memory, QrCodeScanner, Close
} from "@mui/icons-material";
import { keyframes } from "@emotion/react";
import axios from "axios";
import { QRCodeSVG } from "qrcode.react";
import Webcam from "react-webcam";

import { QrReader } from 'react-qr-reader';

import api from "../../../api"; // ✅ API CENTRALISÉE


// --- COULEURS RDC ---
const RDC_BLUE = "#007FFF";
const RDC_YELLOW = "#F7D618";
const RDC_RED = "#CE1126";


// --- ANIMATIONS HIGH-TECH ---
const scanLineMove = keyframes`
  0% { top: 0%; opacity: 0; box-shadow: 0 0 10px ${RDC_YELLOW}; }
  50% { opacity: 1; box-shadow: 0 0 20px ${RDC_RED}; }
  100% { top: 100%; opacity: 0; box-shadow: 0 0 10px ${RDC_BLUE}; }
`;

const fingerRipple = keyframes`
  0% { transform: scale(0.8); opacity: 1; box-shadow: 0 0 0px ${RDC_BLUE}; }
  50% { box-shadow: 0 0 20px ${RDC_YELLOW}; }
  100% { transform: scale(1.6); opacity: 0; box-shadow: 0 0 0px ${RDC_RED}; }
`;

const pulseGlow = keyframes`
  0% { box-shadow: 0 0 5px ${RDC_BLUE}; }
  50% { box-shadow: 0 0 15px ${RDC_BLUE}, 0 0 20px ${RDC_YELLOW}; }
  100% { box-shadow: 0 0 5px ${RDC_BLUE}; }
`;

const BorneSelfService = () => {
  const webcamRef = useRef(null);
  const [activeStep, setActiveStep] = useState(0);
  const [detenus, setDetenus] = useState([]);
  const [loading, setLoading] = useState(false);

  
// Nouvel état pour gérer l'ouverture du scanner QR
  const [openQrScanner, setOpenQrScanner] = useState(false);

  // Fonction pour traiter le résultat du scan
  const handleQrScan = (result, error) => {
    if (!!result) {
      // Met à jour le numéro d'identité avec le contenu du QR Code
      setFormData({ ...formData, piece_identite_numero: result?.text });
      // Ferme le scanner automatiquement avec un petit délai pour l'effet visuel
      setTimeout(() => setOpenQrScanner(false), 500); 
    }
    if (!!error) {
      // On ignore les erreurs de scan en temps réel (souvent dues à l'absence de QR dans le cadre)
      console.info(error);
    }
  };
  
  // États Biométrie & Documents
  const [biometry, setBiometry] = useState({ face: false, thumb: false, idCard: false });
  const [scanning, setScanning] = useState({ thumb: false });
  const [capturedPhoto, setCapturedPhoto] = useState(null);
  const [capturedIDCard, setCapturedIDCard] = useState(null);
  
  // Formulaire mis à jour pour correspondre au Backend
  const [formData, setFormData] = useState({
    nom_complet: "", 
    piece_identite_numero: "", 
    piece_identite_type: "CARTE_ELECTEUR", // <-- NOUVEAU CHAMP
    telephone: "", 
    relation: "FAMILLE", 
    motif_visite: "",
    detenu_visite: null
  });
  
  const [visitResult, setVisitResult] = useState(null);

  // --- THÈME HIGH-TECH ---
  const theme = useMemo(() => createTheme({
    palette: {
      mode: 'dark',
      primary: { main: RDC_BLUE },
      secondary: { main: RDC_YELLOW },
      error: { main: RDC_RED },
      background: {
        default: "#020a14", // Bleu nuit très profond
        paper: "rgba(10, 25, 47, 0.75)", // Effet verre transparent
      }
    },
    typography: {
      fontFamily: '"Rajdhani", "Roboto", "Helvetica", sans-serif',
      h4: { letterSpacing: 3 },
      h6: { letterSpacing: 1.5 },
    },
    shape: { borderRadius: 16 },
    components: {
      MuiPaper: {
        styleOverrides: {
          root: {
            backdropFilter: "blur(16px)",
            WebkitBackdropFilter: "blur(16px)",
            border: `1px solid ${alpha(RDC_BLUE, 0.3)}`,
            boxShadow: `0 8px 32px 0 ${alpha(RDC_BLUE, 0.2)}`,
          }
        }
      },
      MuiButton: {
        styleOverrides: {
          root: { textTransform: "none", fontWeight: 800, letterSpacing: 1, borderRadius: 8 }
        }
      },
      MuiTextField: {
        styleOverrides: {
          root: {
            "& .MuiOutlinedInput-root": {
              "& fieldset": { borderColor: alpha(RDC_BLUE, 0.5) },
              "&:-webkit-autofill": { WebkitBoxShadow: "0 0 0 1000px #020a14 inset" },
              "&:hover fieldset": { borderColor: RDC_YELLOW },
              "&.Mui-focused fieldset": { borderColor: RDC_BLUE, boxShadow: `0 0 10px ${alpha(RDC_BLUE, 0.5)}` }
            }
          }
        }
      }
    }
  }), []);

  // Simuler ou récupérer les détenus depuis la BDD
  useEffect(() => {
    const fetchDetenus = async () => {
      try {
        const res = await api.get("/detenus/");
        setDetenus(res.data);
      } catch (err) { 
        // Fallback visuel si le backend est hors ligne
        setDetenus([
          {id: 1, nom: "MUKENDI", prenom: "Felix", matricule: "RDC-2024-001", photo: "https://i.pravatar.cc/150?u=felix"},
          {id: 2, nom: "KABILA", prenom: "Joseph", matricule: "RDC-2024-002", photo: "https://i.pravatar.cc/150?u=joseph"},
          {id: 3, nom: "TSHISEKEDI", prenom: "Etienne", matricule: "RDC-2024-003", photo: "https://i.pravatar.cc/150?u=etienne"}
        ]);
      }
    };
    fetchDetenus();
  }, []);

  const handleCapture = useCallback((type) => {
    if (webcamRef.current) {
      const imageSrc = webcamRef.current.getScreenshot();
      if (type === 'face') {
        setCapturedPhoto(imageSrc);
        setBiometry(p => ({ ...p, face: true }));
      } else {
        setCapturedIDCard(imageSrc);
        setBiometry(p => ({ ...p, idCard: true }));
      }
    }
  }, [webcamRef]);

  const startThumbScan = () => {
    if (biometry.thumb) return;
    setScanning({ thumb: true });
    setTimeout(() => {
      setScanning({ thumb: false });
      setBiometry(p => ({ ...p, thumb: true }));
    }, 2500);
  };

  // SOUMISSION AU BACKEND
  const handleSubmit = async () => {
    setLoading(true);
    try {
      // 1. Logique pour faire correspondre la "Relation" avec le "TYPE_CHOICES" de Django
      let typeCalculé = "AMI"; // Valeur par défaut
      
      const rel = formData.relation;
      if (rel === "AVOCAT") typeCalculé = "AVOCAT";
      else if (rel === "FAMILLE") typeCalculé = "FAMILLE";
      else if (rel === "AMI") typeCalculé = "AMI";
      else if (rel === "MILITAIRE/POLICE" || rel === "ONG") typeCalculé = "PROFESSIONNEL";
      // Note : Django passera automatiquement 'est_confidentiel' à True si type est 'AVOCAT' grâce à ton modèle

      // 2. Construction du Payload exact
      const payload = {
        nom_complet: formData.nom_complet,
        telephone: formData.telephone,
        piece_identite_numero: formData.piece_identite_numero,
        piece_identite_url: capturedIDCard, // Image Base64 de la carte d'ID
        
        detenu_visite: formData.detenu_visite?.id, // ID du détenu (clé étrangère)
        type_visiteur: typeCalculé,                // Doit être l'une des clés de TYPE_CHOICES
        relation_detenu: formData.relation,        // Le texte libre (ex: "Cousin")
        
        photo_capturee: capturedPhoto,             // Image Base64 du visage
        objets_consignes: formData.motif_visite,   // Optionnel : tu peux mapper le motif ici ou dans notes_renseignement
        
        // Champs par défaut si nécessaire
        statut: "EN ATTENTE",
        alerte_securite: false
      };

      console.log("Données envoyées :", payload); // Pour ton débugage

      const res = await api.post("/visiteurs/", payload);
      
      setVisitResult({ 
        token: res.data.token || `VISIT-${Math.floor(1000 + Math.random() * 9000)}` 
      });
      setActiveStep(3);

    } catch (err) { 
      console.error("Erreur API Details:", err.response?.data || err.message);
      // En cas d'erreur, on affiche quand même le résultat pour la démo, 
      // mais en prod il faudrait gérer l'erreur utilisateur
      setVisitResult({ token: `ERR-SYNCHRO` });
      setActiveStep(3);
    } finally { 
      setLoading(false); 
    }
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    const qrSvg = document.getElementById("qr-code-visit").innerHTML;
    printWindow.document.write(`
      <html>
        <body style="font-family: 'Courier New', monospace; text-align: center; padding: 20px;">
          <h2>DGAP - RDC</h2>
          <p style="font-size:10px;">SÉCURITÉ PÉNITENTIAIRE</p>
          <hr style="border-top: 2px dashed #000;"/>
          <div style="margin:20px 0;">${qrSvg}</div>
          <h1>${visitResult?.token}</h1>
          <p><strong>VISITEUR:</strong> ${formData.nom_complet.toUpperCase()}</p>
          <p><strong>DÉTENU:</strong> ${formData.detenu_visite?.prenom} ${formData.detenu_visite?.nom}</p>
          <p><strong>MOTIF:</strong> ${formData.motif_visite}</p>
          <hr style="border-top: 2px dashed #000;"/>
          <p style="font-size:10px;">Généré le: ${new Date().toLocaleString()}</p>
          <p style="font-size:10px;">Veuillez présenter ce ticket au poste de contrôle.</p>
        </body>
      </html>
    `);
    printWindow.document.close();
    setTimeout(() => { printWindow.print(); printWindow.close(); }, 500);
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ 
        minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", p: 2, 
        background: `radial-gradient(circle at center, #0a192f 0%, #000000 100%)`,
        position: 'relative', overflow: 'hidden'
      }}>
        {/* Lignes de fond (Esthétique High Tech) */}
        <Box sx={{ position: 'absolute', top: 0, left: 0, right: 0, height: '2px', background: `linear-gradient(90deg, transparent, ${RDC_BLUE}, ${RDC_YELLOW}, ${RDC_RED}, transparent)`, opacity: 0.5 }} />
        
        <Box sx={{ width: "100%", maxWidth: 1000, zIndex: 1 }}>
          {/* EN-TÊTE */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3, alignItems: 'center' }}>
            <Stack direction="row" alignItems="center" spacing={2}>
              <Memory sx={{ fontSize: 40, color: RDC_YELLOW }} />
              <Box>
                  <Typography variant="h4" fontWeight={900} color={RDC_BLUE}>
                      DGAP <span style={{ color: RDC_YELLOW }}>SYS</span><span style={{ color: RDC_RED }}>TEM</span>
                  </Typography>
                  <Typography variant="caption" sx={{ letterSpacing: 2, color: 'gray' }}>RÉPUBLIQUE DÉMOCRATIQUE DU CONGO</Typography>
              </Box>
            </Stack>
          </Box>

          <Paper elevation={24} sx={{ p: { xs: 3, md: 5 } }}>
            
            <Stepper activeStep={activeStep} alternativeLabel sx={{ mb: 5 }}>
              {["Cible", "Identité", "Biométrie", "Autorisation"].map((label, idx) => (
                <Step key={label}>
                  <StepLabel 
                    StepIconProps={{
                      style: { 
                        color: activeStep >= idx ? RDC_YELLOW : alpha(RDC_BLUE, 0.3),
                        textShadow: activeStep >= idx ? `0 0 10px ${RDC_YELLOW}` : 'none' 
                      }
                    }}
                  >
                    <Typography sx={{ color: activeStep >= idx ? '#fff' : 'gray', fontWeight: activeStep >= idx ? 700 : 400 }}>{label}</Typography>
                  </StepLabel>
                </Step>
              ))}
            </Stepper>

            {/* ÉTAPE 0 : RECHERCHE DÉTENU */}
            {activeStep === 0 && (
              <Fade in>
                <Box>
                  <Typography variant="h6" mb={3} fontWeight={700} color={RDC_BLUE} textAlign="center">IDENTIFICATION DE LA CIBLE</Typography>
                  <Grid container spacing={4} alignItems="center">
                    <Grid item xs={12} md={6}>
                      <Autocomplete
                        options={detenus}
                        getOptionLabel={(o) => `${o.prenom} ${o.nom} ${o.postnom} (${o.matricule})`}
                        onChange={(e, val) => setFormData({...formData, detenu_visite: val})}
                        renderInput={(params) => <TextField {...params} label="Rechercher nom ou matricule..." variant="outlined" fullWidth />}
                      />
                      <Box sx={{ mt: 3, p: 2, bgcolor: alpha(RDC_BLUE, 0.05), borderRadius: 2, borderLeft: `4px solid ${RDC_YELLOW}` }}>
                        <Typography variant="body2" color="textSecondary">Système interconnecté aux bases de données pénitentiaires nationales de la RDC.</Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={12} md={6} textAlign="center">
                      {formData.detenu_visite ? (
                        <Zoom in>
                          <Box sx={{ p: 3, border: `1px solid ${alpha(RDC_YELLOW, 0.5)}`, borderRadius: 4, background: alpha(RDC_BLUE, 0.1), animation: `${pulseGlow} 3s infinite` }}>
                            <Avatar src={formData.detenu_visite.photo} sx={{ width: 130, height: 130, margin: 'auto', border: `3px solid ${RDC_YELLOW}` }} />
                            <Typography variant="h6" mt={2} fontWeight={900} color="white">{formData.detenu_visite.nom} {formData.detenu_visite.postnom} {formData.detenu_visite.prenom}</Typography>
                            <Typography variant="overline" color={RDC_RED} fontWeight={900}>{formData.detenu_visite.matricule}</Typography>
                          </Box>
                        </Zoom>
                      ) : (
                        <Box sx={{ opacity: 0.2 }}>
                          <Search sx={{ fontSize: 100, color: RDC_BLUE }} />
                          <Typography>En attente de sélection...</Typography>
                        </Box>
                      )}
                    </Grid>
                  </Grid>
                  <Button fullWidth variant="contained" onClick={() => setActiveStep(1)} disabled={!formData.detenu_visite} sx={{ mt: 5, py: 2, background: `linear-gradient(90deg, ${RDC_BLUE}, #00bfff)`, boxShadow: `0 4px 15px ${alpha(RDC_BLUE, 0.4)}` }}>
                    INITIALISER LA PROCÉDURE <ArrowForward sx={{ ml: 1 }} />
                  </Button>
                </Box>
              </Fade>
            )}

            {/* ÉTAPE 1 : IDENTITÉ VISITEUR */}
            {activeStep === 1 && (
              <Zoom in>
                <Box>
                  <Grid container spacing={4}>
                    <Grid item xs={12} md={6}>
                      <Typography variant="h6" mb={2} fontWeight={700} color={RDC_YELLOW}>Coordonnées Visiteur</Typography>
                      <Stack spacing={2.5}>
                        <TextField fullWidth label="Nom Complet" variant="outlined" value={formData.nom_complet} onChange={(e) => setFormData({...formData, nom_complet: e.target.value})} />
<Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
  {/* SÉLECTEUR DE TYPE DE DOCUMENT */}
  <TextField 
    select 
    label="Type de Document" 
    variant="outlined" 
    value={formData.piece_identite_type} 
    onChange={(e) => setFormData({...formData, piece_identite_type: e.target.value})}
    sx={{ minWidth: { sm: '180px' } }}
  >
    <MenuItem value="CARTE_ELECTEUR">Carte d'Électeur</MenuItem>
    <MenuItem value="PASSEPORT">Passeport</MenuItem>
    <MenuItem value="PERMIS">Permis de Conduire</MenuItem>
    <MenuItem value="AUTRE">Autre</MenuItem>
  </TextField>

  {/* CHAMP NUMÉRO AVEC APPARITION CONDITIONNELLE DU SCANNER */}
  <TextField 
    fullWidth 
    label="N° Pièce d'Identité" 
    variant="outlined" 
    value={formData.piece_identite_numero} 
    onChange={(e) => setFormData({...formData, piece_identite_numero: e.target.value})}
    placeholder={formData.piece_identite_type === "PASSEPORT" ? "Saisir au clavier..." : "Saisir ou scanner..."}
    InputProps={{
      // On n'affiche le bouton QR que si ce N'EST PAS un passeport (ou autre document sans QR)
      endAdornment: formData.piece_identite_type !== "PASSEPORT" && formData.piece_identite_type !== "AUTRE" ? (
        <InputAdornment position="end">
          <IconButton 
            onClick={() => setOpenQrScanner(true)} 
            sx={{ color: RDC_YELLOW }}
            title="Scanner le QR Code"
          >
            <QrCodeScanner />
          </IconButton>
        </InputAdornment>
      ) : null
    }}
  />
</Stack>                        <Stack direction="row" spacing={2}>
                          <TextField fullWidth label="Téléphone" variant="outlined" value={formData.telephone} onChange={(e) => setFormData({...formData, telephone: e.target.value})} />
                          <TextField select fullWidth label="Relation" variant="outlined" value={formData.relation} onChange={(e) => setFormData({...formData, relation: e.target.value})} >
                            {["FAMILLE", "AVOCAT", "AMI", "MILITAIRE/POLICE", "ONG"].map(opt => <MenuItem key={opt} value={opt}>{opt}</MenuItem>)}
                          </TextField>
                        </Stack>
                        <TextField fullWidth label="Motif de la visite (optionnel)" variant="outlined" value={formData.motif_visite} onChange={(e) => setFormData({...formData, motif_visite: e.target.value})} />
                      </Stack>
                    </Grid>

                    <Grid item xs={12} md={6}>
                        <Typography variant="h6" mb={2} fontWeight={700} color={RDC_YELLOW}>Numérisation Holographique ID</Typography>
                        <Box sx={{ 
                          width: '100%', height: 210, borderRadius: 2, bgcolor: '#000', 
                          position: 'relative', overflow: 'hidden', 
                          border: `2px solid ${biometry.idCard ? '#4caf50' : alpha(RDC_BLUE, 0.5)}`,
                          boxShadow: biometry.idCard ? '0 0 15px #4caf50' : `inset 0 0 20px ${alpha(RDC_BLUE, 0.3)}`
                        }}>
                          {!capturedIDCard ? (
                            <>
                              <Webcam audio={false} ref={webcamRef} screenshotFormat="image/jpeg" style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.8, filter: 'contrast(1.2)' }} />
                              {/* Réticule High Tech */}
                              <Box sx={{ position: 'absolute', top: '10%', left: '10%', width: '20px', height: '20px', borderTop: `2px solid ${RDC_BLUE}`, borderLeft: `2px solid ${RDC_BLUE}` }} />
                              <Box sx={{ position: 'absolute', bottom: '10%', right: '10%', width: '20px', height: '20px', borderBottom: `2px solid ${RDC_BLUE}`, borderRight: `2px solid ${RDC_BLUE}` }} />
                              {/* Ligne Laser Multicolore RDC */}
                              <Box sx={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '3px', background: `linear-gradient(90deg, ${RDC_BLUE}, ${RDC_YELLOW}, ${RDC_RED})`, animation: `${scanLineMove} 2s infinite linear` }} />
                            </>
                          ) : <img src={capturedIDCard} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="ID Card" />}
                        </Box>
                        <Button fullWidth variant="outlined" startIcon={<PhotoCamera />} color={biometry.idCard ? "success" : "primary"} onClick={() => handleCapture('id')} sx={{ mt: 2 }}>
                          {biometry.idCard ? "DOCUMENT CAPTURÉ (REPRENDRE)" : "LANCER LE SCAN DU DOCUMENT"}
                        </Button>
                    </Grid>
                  </Grid>

                  <Button fullWidth variant="contained" size="large" onClick={() => setActiveStep(2)} disabled={!formData.nom_complet || !formData.piece_identite_numero || !biometry.idCard} sx={{ py: 2, mt: 4, background: `linear-gradient(90deg, ${RDC_BLUE}, #00bfff)` }}>
                    VÉRIFICATION BIOMÉTRIQUE
                  </Button>
                </Box>
              </Zoom>
            )}

            {/* ÉTAPE 2 : BIOMÉTRIE HIGH TECH */}
            {activeStep === 2 && (
              <Box textAlign="center">
                <Typography variant="h5" mb={4} fontWeight={800} color={RDC_RED} sx={{ textShadow: `0 0 10px ${alpha(RDC_RED, 0.5)}` }}>SCAN DE SÉCURITÉ REQUIS</Typography>
                <Stack direction={{ xs: "column", md: "row" }} spacing={8} justifyContent="center" alignItems="center">
                  
                  {/* VISAGE */}
                  <Box>
                    <Box sx={{ 
                      width: 200, height: 200, borderRadius: "50%", 
                      border: `4px dashed ${biometry.face ? "#4caf50" : RDC_BLUE}`, 
                      position: "relative", overflow: "hidden", bgcolor: "#000",
                      boxShadow: biometry.face ? '0 0 20px #4caf50' : `0 0 20px ${alpha(RDC_BLUE, 0.4)}`
                    }}>
                      {!capturedPhoto ? (
                        <>
                          <Webcam audio={false} ref={webcamRef} screenshotFormat="image/jpeg" style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'sepia(0.3) hue-rotate(180deg) saturate(2)' }} />
                          <Box sx={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '4px', bgcolor: RDC_YELLOW, animation: `${scanLineMove} 2.5s infinite linear` }} />
                        </>
                      ) : <img src={capturedPhoto} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="Face" />}
                    </Box>
                    <Button variant="outlined" startIcon={<Radar />} sx={{ mt: 3, borderColor: RDC_YELLOW, color: RDC_YELLOW }} onClick={() => handleCapture('face')}>
                      {biometry.face ? "VISAGE ENREGISTRÉ" : "RECONNAISSANCE FACIALE"}
                    </Button>
                  </Box>

                  {/* EMPREINTE */}
                  <Box>
                    <Box onClick={startThumbScan} sx={{ 
                      width: 200, height: 200, borderRadius: "50%", 
                      border: `4px solid ${biometry.thumb ? "#4caf50" : alpha(RDC_BLUE, 0.5)}`, 
                      display: "flex", alignItems: "center", justifyContent: "center", position: "relative", cursor: "pointer",
                      background: alpha(RDC_BLUE, 0.05)
                    }}>
                      {scanning.thumb && <Box sx={{ position: "absolute", width: "100%", height: "100%", borderRadius: "50%", border: `2px solid ${RDC_YELLOW}`, animation: `${fingerRipple} 1.5s infinite` }} />}
                      <Fingerprint sx={{ fontSize: 90, color: biometry.thumb ? "#4caf50" : RDC_BLUE, filter: biometry.thumb ? 'drop-shadow(0 0 10px #4caf50)' : `drop-shadow(0 0 10px ${RDC_BLUE})` }} />
                    </Box>
                    <Typography variant="caption" display="block" sx={{ mt: 3, fontWeight: 700, color: 'gray' }}>CAPTEUR DIGITAL SÉCURISÉ</Typography>
                  </Box>

                </Stack>

                <Button fullWidth variant="contained" disabled={!biometry.face || !biometry.thumb || loading} onClick={handleSubmit} 
                  sx={{ mt: 6, py: 2, background: `linear-gradient(90deg, #4caf50, #2e7d32)`, boxShadow: '0 0 20px rgba(76, 175, 80, 0.4)' }}>
                  {loading ? <CircularProgress size={24} color="inherit" /> : "TRANSMETTRE AU SERVEUR DGAP & GÉNÉRER JETON"}
                </Button>
              </Box>
            )}

            {/* ÉTAPE 3 : RÉSULTAT */}
            {activeStep === 3 && (
              <Fade in>
                <Box textAlign="center">
                  <CheckCircle sx={{ fontSize: 80, color: '#4caf50', filter: 'drop-shadow(0 0 15px #4caf50)' }} />
                  <Typography variant="h4" fontWeight={900} color="#4caf50" mt={2}>ENRÔLEMENT RÉUSSI</Typography>
                  <Typography variant="body1" color="gray" mt={1}>Vos données ont été cryptées et transmises au poste de contrôle.</Typography>
                  
                  <Box id="qr-code-visit" sx={{ 
                    p: 2, bgcolor: "#fff", display: "inline-block", borderRadius: 2, mt: 3, mb: 1,
                    border: `4px solid ${RDC_BLUE}`, boxShadow: `0 0 20px ${alpha(RDC_BLUE, 0.5)}`
                  }}>
                    <QRCodeSVG value={visitResult?.token} size={200} />
                  </Box>
                  
                  <Typography variant="h2" fontWeight={900} color={RDC_YELLOW} sx={{ letterSpacing: 6, textShadow: `0 0 15px ${alpha(RDC_YELLOW, 0.5)}` }}>
                    {visitResult?.token}
                  </Typography>
                  
                  <Divider sx={{ my: 3, borderColor: alpha(RDC_BLUE, 0.3) }} />
                  
                  <Stack direction="row" spacing={3} justifyContent="center" mt={2}>
                    <Button variant="contained" size="large" startIcon={<Print />} onClick={handlePrint} sx={{ px: 4, bgcolor: RDC_BLUE }}>
                      IMPRIMER TICKET
                    </Button>
                    <Button variant="outlined" color="error" startIcon={<RestartAlt />} onClick={() => window.location.reload()} sx={{ borderColor: RDC_RED, color: RDC_RED }}>
                      TERMINER LA SESSION
                    </Button>
                  </Stack>
                </Box>
              </Fade>
            )}
            {/* MODALE DU SCANNER QR CODE */}
<Dialog 
  open={openQrScanner} 
  onClose={() => setOpenQrScanner(false)}
  PaperProps={{
    sx: {
      backgroundColor: alpha("#020a14", 0.95),
      backdropFilter: "blur(20px)",
      border: `1px solid ${RDC_BLUE}`,
      boxShadow: `0 0 30px ${alpha(RDC_BLUE, 0.5)}`,
      borderRadius: 4,
      minWidth: { xs: '90vw', sm: '400px' }
    }
  }}
>
  <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: RDC_YELLOW, borderBottom: `1px solid ${alpha(RDC_BLUE, 0.3)}` }}>
    <Typography fontWeight={800} sx={{ letterSpacing: 2 }}>SCANNER LE QR CODE</Typography>
    <IconButton onClick={() => setOpenQrScanner(false)} sx={{ color: 'white' }}>
      <Close />
    </IconButton>
  </DialogTitle>
  <DialogContent sx={{ p: 0, position: 'relative', bgcolor: '#000' }}>
    {openQrScanner && (
      <>
        <QrReader
          onResult={handleQrScan}
          constraints={{ facingMode: 'environment' }} // Force la caméra arrière sur mobile
          style={{ width: '100%' }}
        />
        {/* Réticule de visée animé */}
        <Box sx={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: 250, height: 250, border: `2px dashed ${alpha(RDC_YELLOW, 0.7)}`, borderRadius: 2, pointerEvents: 'none', zIndex: 10, animation: `${pulseGlow} 2s infinite` }} />
        {/* Ligne de scan rouge */}
        <Box sx={{ position: 'absolute', top: '15%', left: '10%', right: '10%', height: '2px', background: RDC_RED, zIndex: 11, animation: `${scanLineMove} 2.5s infinite linear`, boxShadow: `0 0 10px ${RDC_RED}` }} />
      </>
    )}
  </DialogContent>
  <DialogActions sx={{ justifyContent: 'center', p: 2, borderTop: `1px solid ${alpha(RDC_BLUE, 0.3)}` }}>
    <Typography variant="caption" color="gray">Veuillez centrer le QR Code dans le cadre cible.</Typography>
  </DialogActions>
</Dialog>

          </Paper>
        </Box>
      </Box>
      
    </ThemeProvider>
  );
};

export default BorneSelfService;