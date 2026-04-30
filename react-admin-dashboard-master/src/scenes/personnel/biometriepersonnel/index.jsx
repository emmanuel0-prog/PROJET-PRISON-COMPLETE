import React, { useState, useRef, useEffect } from "react";
import { useParams } from "react-router-dom"; // Ajout de useParams pour récupérer l'ID de l'URL
import {
  Box, Typography, alpha, Button, Grid, TextField,
  Paper, Stack, Divider, MenuItem, Switch, FormControlLabel,
  Tab, Tabs, LinearProgress, Chip, useTheme
} from "@mui/material";
import {
  FingerprintOutlined, PhotoCameraOutlined, VerifiedUserOutlined,
  BadgeOutlined, SaveOutlined, DrawOutlined, GppGoodOutlined,
  FiberManualRecord, PersonOutlined, WorkOutlineOutlined,
  WarningAmberOutlined, EditOutlined
} from "@mui/icons-material";
import axios from 'axios';
import api from "../../../api"; // Import de l'instance axios préconfigurée

// --- IMAGES ---
import sceauRdc from "../../../assets/gouvernement rdc.png"; 
import drapeauRdc from "../../../assets/rdc.png";

// --- COULEURS OFFICIELLES RDC ---
const RDC_BLUE = "#007FFF";
const RDC_YELLOW = "#F7D618";
const RDC_RED = "#CE1126";

const BiometriePersonnel = ({ agentToEdit = null }) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  
  // 1. Récupération de l'ID depuis l'URL
  const { id } = useParams(); 

  const [bioTab, setBioTab] = useState(0);
  const [formTab, setFormTab] = useState(0);
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [cameraError, setCameraError] = useState(false);
  const [capturedPhoto, setCapturedPhoto] = useState(null); 
  const [photoFile, setPhotoFile] = useState(null); 
  const videoRef = useRef(null);

  // 2. État pour stocker l'agent récupéré via l'API
  const [fetchedAgent, setFetchedAgent] = useState(null);

  const initialFormState = {
    matricule: "", nni: "", nom: "", postnom: "", prenom: "",
    sexe: "M", date_naissance: "", lieu_naissance: "", groupe_sanguin: "",
    grade: "", echelon: "", date_prise_fonction: "", date_fin_contrat: "",
    est_officier_judiciaire: false, statut: "EN POSTE", secteur: "SECURITE", affectation: "",
    telephone: "", email_professionnel: "", adresse_residence: "",
    contact_urgence_nom: "", contact_urgence_tel: "", code_pin_securite: ""
  };

  const [formData, setFormData] = useState(initialFormState);

  // --- NOUVEAU: RECUPERATION VIA L'API SI ID DANS L'URL ---
  useEffect(() => {
    if (id) {
      const fetchAgent = async () => {
        try {
          const response = await api.get(`http://127.0.0.1:8000/api/agents/${id}/`);
          setFetchedAgent(response.data);
        } catch (error) {
          console.error("Erreur de chargement des données de l'agent :", error);
        }
      };
      fetchAgent();
    }
  }, [id]);

  // 3. Définir l'agent actif (soit via prop, soit via l'API)
  const activeAgent = fetchedAgent || agentToEdit;
  const isEditing = !!activeAgent || !!id; // True si on est en mode édition

  // --- INITIALISATION POUR LA MODIFICATION ---
  useEffect(() => {
    if (activeAgent) {
      setFormData({
        ...initialFormState,
        ...activeAgent,
        code_pin_securite: "" // On vide pour la sécurité
      });
      if (activeAgent.photo) {
        setCapturedPhoto(activeAgent.photo);
      }
    } else {
      setFormData(initialFormState);
      setCapturedPhoto(null);
      setPhotoFile(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeAgent]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({ ...formData, [name]: type === 'checkbox' ? checked : value });
  };
  
  const handleCapture = () => {
    if (videoRef.current) {
      const video = videoRef.current;
      const canvas = document.createElement("canvas");
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      const imageData = canvas.toDataURL("image/png");
      setCapturedPhoto(imageData);

      canvas.toBlob((blob) => {
        const file = new File([blob], `photo_${formData.matricule || 'agent'}.png`, { type: "image/png" });
        setPhotoFile(file);
      }, "image/png");
    }
  };

  useEffect(() => {
    let stream = null;
    async function startCamera() {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { width: 1280, height: 720 } });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (err) {
        console.error("Erreur d'accès caméra :", err);
        setCameraError(true);
      }
    }
    if (!capturedPhoto) {
        startCamera();
    }
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [capturedPhoto]);

  const handleStartScan = () => {
    setIsScanning(true);
    setScanProgress(0);
    const interval = setInterval(() => {
      setScanProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsScanning(false);
          return 100;
        }
        return prev + 5;
      });
    }, 100);
  };

  const textFieldStyle = {
    "& .MuiOutlinedInput-root": {
      borderRadius: "8px", 
      bgcolor: theme.palette.background.paper,
      transition: "all 0.3s ease-in-out",
      "& fieldset": { borderColor: theme.palette.divider },
      "& :hover fieldset": { borderColor: alpha(RDC_BLUE, 0.5) },
      "&.Mui-focused fieldset": { borderColor: RDC_BLUE, borderWidth: "2px", boxShadow: `0 0 10px ${alpha(RDC_BLUE, 0.2)}` },
    },
    "& .MuiInputLabel-root": { fontWeight: 800, fontSize: '0.75rem', color: theme.palette.text.secondary },
    "& .MuiInputBase-input": { color: theme.palette.text.primary }
  };

  const handleSubmit = async () => {
    try {
      console.log(isEditing ? "Mise à jour des données..." : "Envoi des données au serveur...");

      const dataToSend = new FormData();
      
      Object.keys(formData).forEach(key => {
        if (isEditing && key === 'code_pin_securite' && !formData[key]) return;
        
        if (key !== 'photo') {
          dataToSend.append(key, formData[key] === null ? "" : formData[key]);
        }
      });

      if (photoFile) {
        dataToSend.append("photo", photoFile);
      }

      let response;
      const targetId = activeAgent?.id || id; // On utilise l'ID ciblé pour le PATCH

      if (isEditing && targetId) {
        response = await api.patch(`/agents/${targetId}/`, dataToSend, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        alert(`Mise à jour réussie ! Matricule : ${response.data.matricule}`);
      } else {
        response = await api.post("/agents/", dataToSend, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        alert(`Enrôlement réussi ! Matricule : ${response.data.matricule}`);
      }
      
      console.log("Succès:", response.data);
      
    } catch (error) {
      console.error("Erreur d'enregistrement:", error);
      if (error.response) {
        alert("Erreur API : " + JSON.stringify(error.response.data));
      } else {
        alert("Impossible de contacter le serveur. Vérifiez que Django est lancé.");
      }
    }
  };

  return (
    <Box sx={{ 
      p: { xs: 1, md: 3 }, 
      bgcolor: theme.palette.background.default, 
      minHeight: "100vh",
      backgroundImage: isDark 
        ? `linear-gradient(${alpha('#fff', 0.03)} 1px, transparent 1px), linear-gradient(90deg, ${alpha('#fff', 0.03)} 1px, transparent 1px)` 
        : `linear-gradient(${alpha('#000', 0.03)} 1px, transparent 1px), linear-gradient(90deg, ${alpha('#000', 0.03)} 1px, transparent 1px)`,
      backgroundSize: '30px 30px'
    }}>
      
      <Paper sx={{ 
        p: 2, 
        mb: 3, 
        borderRadius: "12px", 
        bgcolor: theme.palette.background.paper,
        borderTop: `5px solid ${isEditing ? RDC_YELLOW : RDC_BLUE}`, 
        boxShadow: isDark ? "0 10px 30px rgba(0,0,0,0.5)" : "0 10px 30px rgba(0,0,0,0.05)",
        backdropFilter: "blur(10px)"
      }}>
        <Grid container alignItems="center" spacing={2}>
          <Grid item xs={12} md={7}>
            <Stack direction="row" spacing={3} alignItems="center">
              <Box component="img" src={sceauRdc} sx={{ height: { xs: 50, md: 75 }, filter: isDark ? "drop-shadow(0 2px 4px rgba(255,255,255,0.1))" : "drop-shadow(0 2px 4px rgba(0,0,0,0.1))" }} />
              <Box>
                <Typography variant="overline" fontWeight={900} color={RDC_BLUE} sx={{ letterSpacing: 2, lineHeight: 1 }}>
                  République Démocratique du Congo
                </Typography>
                <Typography variant="h5" fontWeight={900} color={theme.palette.text.primary} sx={{ textTransform: "uppercase", mt: 0.5 }}>
                  Ministère de la Justice et Garde des Sceaux
                </Typography>
                <Typography variant="caption" fontWeight={700} color={isEditing ? RDC_YELLOW : theme.palette.text.secondary}>
                  SYSTÈME CENTRALISÉ {isEditing ? "DE MISE À JOUR " : "D'ENRÔLEMENT "} DES AGENTS PÉNITENTIAIRES
                </Typography>
              </Box>
            </Stack>
          </Grid>
          <Grid item xs={12} md={5} textAlign={{ xs: "left", md: "right" }}>
             <Stack direction="row" spacing={2} justifyContent={{ xs: "flex-start", md: "flex-end" }} alignItems="center">
                <Box>
                   <Typography variant="caption" display="block" fontWeight={900} sx={{ color: "success.main", display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 0.5, textShadow: isDark ? "0 0 5px rgba(46, 125, 50, 0.5)" : "none" }}>
                     <FiberManualRecord sx={{ fontSize: 10, animation: 'pulse 2s infinite' }} /> SECURE AES-256
                   </Typography>
                   <Typography variant="body2" fontWeight={800} color={theme.palette.text.primary} sx={{ fontFamily: 'monospace' }}>
                     Station ID: KIN-PRIS-01
                   </Typography>
                </Box>
                <Box component="img" src={drapeauRdc} sx={{ height: 45, borderRadius: "4px", boxShadow: "0 4px 10px rgba(0,0,0,0.2)" }} />
             </Stack>
          </Grid>
        </Grid>
      </Paper>

      <Grid container spacing={3}>
        <Grid item xs={12} lg={7}>
          <Paper sx={{ 
            p: 0, 
            borderRadius: "20px", 
            border: `1px solid ${theme.palette.divider}`, 
            bgcolor: theme.palette.background.paper,
            overflow: "hidden",
            boxShadow: theme.shadows[3]
          }}>
            <Tabs 
              value={formTab} 
              onChange={(e, v) => setFormTab(v)} 
              variant="fullWidth" 
              sx={{ 
                bgcolor: isDark ? alpha(theme.palette.background.default, 0.5) : "#F8FAFC", 
                borderBottom: `1px solid ${theme.palette.divider}`,
                "& .MuiTabs-indicator": { height: 3, borderRadius: '3px 3px 0 0', bgcolor: isEditing ? RDC_YELLOW : RDC_BLUE }
              }}
            >
              <Tab icon={<PersonOutlined />} label="ÉTAT CIVIL" sx={{ fontWeight: 800, color: theme.palette.text.secondary, "&.Mui-selected": { color: isEditing ? RDC_YELLOW : RDC_BLUE } }} />
              <Tab icon={<WorkOutlineOutlined />} label="CARRIÈRE & POSTE" sx={{ fontWeight: 800, color: theme.palette.text.secondary, "&.Mui-selected": { color: isEditing ? RDC_YELLOW : RDC_BLUE } }} />
              <Tab icon={<WarningAmberOutlined />} label="CONTACTS & SÉCURITÉ" sx={{ fontWeight: 800, color: theme.palette.text.secondary, "&.Mui-selected": { color: isEditing ? RDC_YELLOW : RDC_BLUE } }} />
            </Tabs>

            <Box sx={{ p: 4 }}>
              {formTab === 0 && (
                <Grid container spacing={2.5}>
                  <Grid item xs={12}><Chip icon={isEditing ? <EditOutlined/> : <VerifiedUserOutlined/>} label={isEditing ? "MODIFICATION IDENTIFICATION" : "IDENTIFICATION UNIQUE"} size="small" sx={{ fontWeight: 800, mb: 1, bgcolor: alpha(isEditing ? RDC_YELLOW : RDC_BLUE, 0.1), color: isEditing ? '#B8860B' : RDC_BLUE, border: `1px solid ${isEditing ? RDC_YELLOW : RDC_BLUE}` }} /></Grid>
                  <Grid item xs={12} md={4}><TextField fullWidth name="matricule" value={formData.matricule} onChange={handleChange} label="MATRICULE" placeholder="AP-2024-X" sx={textFieldStyle} required disabled={isEditing} /></Grid>
                  <Grid item xs={12} md={8}><TextField fullWidth name="nni" value={formData.nni} onChange={handleChange} label="NUMÉRO NATIONAL D'IDENTITÉ (NNI)" sx={textFieldStyle} required /></Grid>
                  
                  <Grid item xs={12}><Divider sx={{ my: 1, borderColor: theme.palette.divider }} /></Grid>
                  
                  <Grid item xs={12} md={4}><TextField fullWidth name="nom" value={formData.nom} onChange={handleChange} label="NOM" sx={textFieldStyle} required /></Grid>
                  <Grid item xs={12} md={4}><TextField fullWidth name="postnom" value={formData.postnom} onChange={handleChange} label="POSTNOM" sx={textFieldStyle} required /></Grid>
                  <Grid item xs={12} md={4}><TextField fullWidth name="prenom" value={formData.prenom} onChange={handleChange} label="PRÉNOM" sx={textFieldStyle} required /></Grid>

                  <Grid item xs={12} md={3}>
                    <TextField select fullWidth name="sexe" value={formData.sexe} onChange={handleChange} label="SEXE" sx={textFieldStyle}>
                      <MenuItem value="M">Masculin</MenuItem>
                      <MenuItem value="F">Féminin</MenuItem>
                    </TextField>
                  </Grid>
                  <Grid item xs={12} md={5}><TextField fullWidth type="date" InputLabelProps={{ shrink: true }} name="date_naissance" value={formData.date_naissance} onChange={handleChange} label="DATE DE NAISSANCE" sx={textFieldStyle} /></Grid>
                  <Grid item xs={12} md={4}>
                    <TextField select fullWidth name="groupe_sanguin" value={formData.groupe_sanguin} onChange={handleChange} label="GROUPE SANGUIN" sx={textFieldStyle}>
                      {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(gs => <MenuItem key={gs} value={gs}>{gs}</MenuItem>)}
                    </TextField>
                  </Grid>
                  <Grid item xs={12}><TextField fullWidth name="lieu_naissance" value={formData.lieu_naissance} onChange={handleChange} label="LIEU DE NAISSANCE" sx={textFieldStyle} /></Grid>
                </Grid>
              )}

              {formTab === 1 && (
                <Grid container spacing={2.5}>
                  <Grid item xs={12} md={6}><TextField fullWidth name="grade" value={formData.grade} onChange={handleChange} label="GRADE HIÉRARCHIQUE" sx={textFieldStyle} /></Grid>
                  <Grid item xs={12} md={6}><TextField fullWidth name="echelon" value={formData.echelon} onChange={handleChange} label="ÉCHELON" sx={textFieldStyle} /></Grid>

                  <Grid item xs={12} md={6}>
                    <TextField select fullWidth name="secteur" value={formData.secteur} onChange={handleChange} label="SECTEUR D'AFFECTATION" sx={textFieldStyle}>
                      <MenuItem value="SECURITE">Sécurité Intérieure</MenuItem>
                      <MenuItem value="LOGISTIQUE">Logistique</MenuItem>
                      <MenuItem value="ADMIN">Administration / Greffe</MenuItem>
                      <MenuItem value="MEDICAL">Unité Médicale</MenuItem>
                    </TextField>
                  </Grid>
                  <Grid item xs={12} md={6}><TextField fullWidth name="affectation" value={formData.affectation} onChange={handleChange} label="LIEU D'AFFECTATION (Ex: Pavillon 4)" sx={textFieldStyle} /></Grid>

                  <Grid item xs={12} md={6}>
                    <TextField select fullWidth name="statut" value={formData.statut} onChange={handleChange} label="STATUT ACTUEL" sx={textFieldStyle}>
                      <MenuItem value="EN POSTE">En Poste</MenuItem>
                      <MenuItem value="CONGÉ">En Congé</MenuItem>
                      <MenuItem value="MISSION">En Mission</MenuItem>
                      <MenuItem value="ALERTE">Alerte Pointage</MenuItem>
                    </TextField>
                  </Grid>

                  <Grid item xs={12}><Divider sx={{ my: 1, borderColor: theme.palette.divider }} /></Grid>

                  <Grid item xs={12} md={6}><TextField fullWidth type="date" InputLabelProps={{ shrink: true }} name="date_prise_fonction" value={formData.date_prise_fonction} onChange={handleChange} label="DATE PRISE DE FONCTION" sx={textFieldStyle} /></Grid>
                  <Grid item xs={12} md={6}><TextField fullWidth type="date" InputLabelProps={{ shrink: true }} name="date_fin_contrat" value={formData.date_fin_contrat} onChange={handleChange} label="DATE FIN DE CONTRAT" sx={textFieldStyle} /></Grid>
                  
                  <Grid item xs={12}>
                    <Paper variant="outlined" sx={{ p: 2, borderColor: formData.est_officier_judiciaire ? RDC_RED : theme.palette.divider, bgcolor: formData.est_officier_judiciaire ? alpha(RDC_RED, 0.05) : 'transparent' }}>
                      <FormControlLabel
                        control={<Switch name="est_officier_judiciaire" checked={formData.est_officier_judiciaire} onChange={handleChange} color="error" />}
                        label={<Typography variant="body2" fontWeight={800} color={theme.palette.text.primary}>A LA QUALITÉ D'OFFICIER DE POLICE JUDICIAIRE (OPJ)</Typography>}
                      />
                    </Paper>
                  </Grid>
                </Grid>
              )}

              {formTab === 2 && (
                <Grid container spacing={2.5}>
                  <Grid item xs={12}><Chip icon={<BadgeOutlined/>} label="COORDONNÉES PERSONNELLES" size="small" sx={{ fontWeight: 800, mb: 1, bgcolor: alpha(RDC_BLUE, 0.1), color: RDC_BLUE, border: `1px solid ${RDC_BLUE}` }} /></Grid>
                  <Grid item xs={12} md={6}><TextField fullWidth name="telephone" value={formData.telephone} onChange={handleChange} label="TÉLÉPHONE PRINCIPAL" sx={textFieldStyle} /></Grid>
                  <Grid item xs={12} md={6}><TextField fullWidth type="email" name="email_professionnel" value={formData.email_professionnel} onChange={handleChange} label="EMAIL PROFESSIONNEL (.gouv.cd)" sx={textFieldStyle} /></Grid>
                  <Grid item xs={12}><TextField fullWidth multiline rows={2} name="adresse_residence" value={formData.adresse_residence} onChange={handleChange} label="ADRESSE DE RÉSIDENCE" sx={textFieldStyle} /></Grid>

                  <Grid item xs={12}><Divider sx={{ my: 1, borderColor: theme.palette.divider }}><Chip label="EN CAS D'URGENCE" size="small" sx={{ fontWeight: 800, color: theme.palette.text.secondary }} /></Divider></Grid>
                  <Grid item xs={12} md={6}><TextField fullWidth name="contact_urgence_nom" value={formData.contact_urgence_nom} onChange={handleChange} label="PERSONNE À PRÉVENIR (NOM)" sx={textFieldStyle} /></Grid>
                  <Grid item xs={12} md={6}><TextField fullWidth name="contact_urgence_tel" value={formData.contact_urgence_tel} onChange={handleChange} label="TÉLÉPHONE URGENCE" sx={textFieldStyle} /></Grid>

                  <Grid item xs={12}><Divider sx={{ my: 1, borderColor: theme.palette.divider }}><Chip icon={<GppGoodOutlined/>} label="SÉCURITÉ" color="error" size="small" sx={{ fontWeight: 800 }} /></Divider></Grid>
                  <Grid item xs={12}>
                    <TextField fullWidth type="password" name="code_pin_securite" value={formData.code_pin_securite} onChange={handleChange} label={isEditing ? "NOUVEAU CODE PIN (Laisser vide pour ne pas changer)" : "CODE PIN SÉCURITÉ (ACCÈS ARMURERIE / ZONES SENSIBLES)"} placeholder="••••••" sx={textFieldStyle} />
                    <Typography variant="caption" color={theme.palette.text.secondary} sx={{ mt: 1, display: 'block' }}>Ce code sera crypté (Hash SHA-256) avant d'être sauvegardé en base de données.</Typography>
                  </Grid>
                </Grid>
              )}
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12} lg={5}>
          <Stack spacing={3}>
            
            <Paper sx={{ 
              p: 2, borderRadius: "20px", 
              bgcolor: isDark ? "#050B14" : "#0A1128", 
              color: "#fff", 
              position: 'relative', overflow: 'hidden', 
              border: `2px solid ${alpha(isEditing ? RDC_YELLOW : RDC_BLUE, 0.5)}`,
              boxShadow: isDark ? `0 0 20px ${alpha(isEditing ? RDC_YELLOW : RDC_BLUE, 0.2)}` : "0 20px 40px rgba(0,0,0,0.2)"
            }}>
              <Box sx={{ position: 'absolute', top: 20, left: 20, zIndex: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                <FiberManualRecord sx={{ color: RDC_RED, fontSize: 12, animation: 'pulse 1.5s infinite', textShadow: `0 0 8px ${RDC_RED}` }} />
                <Typography variant="caption" fontWeight={900} sx={{ letterSpacing: 1, fontFamily: 'monospace' }}>SYS. CAPTURE FACIALE DIRECTE</Typography>
              </Box>
              
              <Box sx={{ position: 'relative', borderRadius: '12px', overflow: 'hidden', bgcolor: '#000', height: 280, border: `1px solid ${alpha('#fff', 0.1)}` }}>
                {cameraError ? (
                  <Stack alignItems="center" justifyContent="center" sx={{ height: '100%' }}>
                    <PhotoCameraOutlined sx={{ fontSize: 50, opacity: 0.3, mb: 2, color: RDC_RED }} />
                    <Typography variant="caption" color="error">Caméra non détectée ou accès refusé</Typography>
                  </Stack>
                ) : capturedPhoto ? (
                  <Box component="img" src={capturedPhoto} sx={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <>
                    <video 
                      ref={videoRef} 
                      autoPlay 
                      playsInline 
                      style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'contrast(1.1) brightness(1.2)' }}
                    />
                    <Box sx={{ 
                      position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
                      width: 180, height: 220, 
                      border: `2px solid ${alpha(RDC_BLUE, 0.3)}`, 
                      borderRadius: '40%',
                      boxShadow: `inset 0 0 20px ${alpha(RDC_BLUE, 0.2)}`,
                      "&::before": { content: '""', position: 'absolute', top: -5, left: -5, width: 20, height: 20, borderTop: `3px solid ${RDC_BLUE}`, borderLeft: `3px solid ${RDC_BLUE}` },
                      "&::after": { content: '""', position: 'absolute', top: -5, right: -5, width: 20, height: 20, borderTop: `3px solid ${RDC_BLUE}`, borderRight: `3px solid ${RDC_BLUE}` }
                    }}>
                      <Box sx={{ position: 'absolute', bottom: -5, left: -5, width: 20, height: 20, borderBottom: `3px solid ${RDC_BLUE}`, borderLeft: `3px solid ${RDC_BLUE}` }} />
                      <Box sx={{ position: 'absolute', bottom: -5, right: -5, width: 20, height: 20, borderBottom: `3px solid ${RDC_BLUE}`, borderRight: `3px solid ${RDC_BLUE}` }} />
                    </Box>
                  </>
                )}
              </Box>

              <Stack direction="row" justifyContent="space-between" alignItems="center" mt={2}>
                <Typography variant="caption" sx={{ color: alpha("#fff", 0.6), fontWeight: 700, fontFamily: 'monospace' }}>
                  AI Status: <span style={{color: capturedPhoto ? "#4CAF50" : RDC_YELLOW}}>{capturedPhoto ? "Capture biométrique réussie" : "En attente du sujet..."}</span>
                </Typography>
                
                {capturedPhoto ? (
                   <Button variant="outlined" size="small" onClick={() => { setCapturedPhoto(null); setPhotoFile(null); }} sx={{ color: "#fff", borderColor: alpha("#fff", 0.3), fontWeight: 900, "&:hover": { borderColor: "#fff" } }}>{isEditing ? "Remplacer Photo" : "Reprendre"}</Button>
                ) : (
                   <Button variant="contained" size="small" onClick={handleCapture} startIcon={<PhotoCameraOutlined />} sx={{ bgcolor: RDC_BLUE, fontWeight: 900, boxShadow: `0 0 15px ${alpha(RDC_BLUE, 0.5)}` }}>Acquisition</Button>
                )}
              </Stack>
            </Paper>

            <Paper sx={{ p: 3, borderRadius: "20px", border: `1px solid ${theme.palette.divider}`, bgcolor: theme.palette.background.paper }}>
              <Tabs value={bioTab} onChange={(e, v) => setBioTab(v)} variant="fullWidth" sx={{ mb: 3, "& .Mui-selected": { color: RDC_BLUE, fontWeight: 900 } }}>
                <Tab icon={<FingerprintOutlined />} label="EMPREINTE" sx={{ color: theme.palette.text.secondary }} />
                <Tab icon={<DrawOutlined />} label="SIGNATURE" sx={{ color: theme.palette.text.secondary }} />
              </Tabs>

              {bioTab === 0 ? (
                <Box textAlign="center" sx={{ py: 1 }}>
                  <Box sx={{ position: 'relative', display: 'inline-block', mb: 2 }}>
                    <FingerprintOutlined sx={{ 
                      fontSize: 80, 
                      color: isScanning ? RDC_BLUE : (isDark ? alpha(theme.palette.text.primary, 0.2) : "#CBD5E1"), 
                      transition: '0.3s',
                      filter: isScanning ? `drop-shadow(0 0 10px ${RDC_BLUE})` : 'none'
                    }} />
                    {isScanning && (
                      <Box sx={{ 
                        position: 'absolute', top: 0, left: 0, width: '100%', height: '3px',
                        bgcolor: RDC_BLUE, boxShadow: `0 0 15px ${RDC_BLUE}, 0 0 30px ${RDC_BLUE}`, 
                        animation: 'scanLine 1.5s infinite cubic-bezier(0.4, 0, 0.2, 1)',
                        borderRadius: '10px'
                      }} />
                    )}
                  </Box>
                  <Typography variant="body2" fontWeight={900} sx={{ mb: 2, fontFamily: 'monospace', color: scanProgress === 100 ? "success.main" : theme.palette.text.primary }}>
                    {scanProgress === 100 ? "✓ EMPREINTE CAPTURÉE" : (isEditing ? "METTRE À JOUR L'EMPREINTE (OPTIONNEL)" : "POSEZ L'INDEX SUR LE SCANNER BIOMÉTRIQUE")}
                  </Typography>
                  <LinearProgress variant="determinate" value={scanProgress} sx={{ height: 8, borderRadius: 4, mb: 3, bgcolor: theme.palette.action.hover, "& .MuiLinearProgress-bar": { bgcolor: RDC_BLUE } }} />
                  <Button 
                    fullWidth 
                    variant="contained" 
                    onClick={handleStartScan}
                    disabled={isScanning}
                    sx={{ 
                      bgcolor: isDark ? theme.palette.grey[800] : "#1A2027", 
                      color: "#fff",
                      fontWeight: 800, py: 1.2, 
                      "&:hover": { bgcolor: isDark ? theme.palette.grey[700] : "#000" } 
                    }}
                  >
                    {isScanning ? "Analyse du template en cours..." : "Démarrer le Scan"}
                  </Button>
                </Box>
              ) : (
                <Box sx={{ 
                  height: 180, 
                  border: `2px dashed ${theme.palette.divider}`, 
                  borderRadius: "12px", 
                  bgcolor: isDark ? alpha(theme.palette.background.default, 0.5) : "#F8FAFC", 
                  display: 'flex', alignItems: 'center', justifyContent: 'center' 
                }}>
                  <Stack alignItems="center" spacing={1}>
                    <DrawOutlined sx={{ opacity: 0.2, fontSize: 40, color: theme.palette.text.primary }} />
                    <Typography variant="caption" color="text.secondary" sx={{ fontFamily: 'monospace' }}>Pad de signature digitalisée prêt</Typography>
                  </Stack>
                </Box>
              )}
            </Paper>

            <Button 
              fullWidth 
              variant="contained" 
              startIcon={isEditing ? <EditOutlined /> : <SaveOutlined />}
              onClick={handleSubmit}
              sx={{ 
                bgcolor: isEditing ? RDC_YELLOW : RDC_BLUE, 
                color: isEditing ? "#000" : "#fff",
                py: 2, 
                borderRadius: "15px", 
                fontWeight: 900, 
                fontSize: "1rem", 
                letterSpacing: 1,
                boxShadow: `0 10px 20px ${alpha(isEditing ? RDC_YELLOW : RDC_BLUE, 0.3)}`,
                "&:hover": { bgcolor: isEditing ? "#D4B400" : "#0066CC" }
              }}
            >
              {isEditing ? "METTRE À JOUR LES DONNÉES DE L'AGENT" : "ENREGISTRER L'AGENT DANS LA BASE"}
            </Button>

          </Stack>
        </Grid>
      </Grid>

      <style>
        {`
          @keyframes pulse {
            0% { transform: scale(1); opacity: 1; }
            50% { transform: scale(1.3); opacity: 0.6; }
            100% { transform: scale(1); opacity: 1; }
          }
          @keyframes scanLine {
            0% { top: -5%; opacity: 0; }
            10% { opacity: 1; }
            90% { opacity: 1; }
            100% { top: 105%; opacity: 0; }
          }
        `}
      </style>
    </Box>
  );
};

export default BiometriePersonnel;