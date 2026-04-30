import React, { useState, useEffect } from "react";
import { 
  Box, Typography, Paper, Stack, Button, TextField, 
  Autocomplete, Divider, Container, Avatar, CircularProgress,
  IconButton, useTheme, alpha, Chip
} from "@mui/material";
import { 
  LocalHospital, Search, UploadFile, Description, 
  HealthAndSafety, Badge, Gavel, HistoryEdu
} from "@mui/icons-material";
import { motion, AnimatePresence } from "framer-motion";
import api from "../../api";

// Assets
import sceauRdc from "../../assets/rdc.png";
import drapeauRdc from "../../assets/gouvernement rdc.png" ;

// Couleurs Officielles RDC
const RDC_BLUE = "#007FFF";
const RDC_YELLOW = "#F7D618";
const RDC_RED = "#CE1126";

const DashboardMedecin = () => {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";

  const [detenus, setDetenus] = useState([]);
  const [selectedDetenu, setSelectedDetenu] = useState(null);
  const [cause, setCause] = useState("");
  const [certificat, setCertificat] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchDetenus = async () => {
      try {
        const res = await api.get("/detenus/");
        setDetenus(res.data);
      } catch (err) {
        console.error("Erreur chargement détenus", err);
      }
    };
    fetchDetenus();
  }, []);

  const handleDeclare = async () => {
    if (!selectedDetenu || !cause) return alert("Veuillez remplir les informations obligatoires.");
    
    setLoading(true);
    const formData = new FormData();
    formData.append("detenu", selectedDetenu.id);
    formData.append("cause", cause);
    if (certificat) formData.append("certificat", certificat);

    try {
      await api.post("/deces/", formData, { 
        headers: { "Content-Type": "multipart/form-data" } 
      });
      alert("Déclaration transmise avec succès au système central.");
      setSelectedDetenu(null);
      setCause("");
      setCertificat(null);
    } catch (err) {
      alert("Erreur lors de la transmission des données.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ 
      minHeight: "100vh",
      background: isDark 
        ? `radial-gradient(circle at 50% 50%, #001a33 0%, #000810 100%)`
        : `linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)`,
      py: 4,
      position: "relative",
      overflow: "hidden"
    }}>
      
      {/* Grid Background High-Tech */}
      <Box sx={{
        position: "absolute", top: 0, left: 0, width: "100%", height: "100%",
        opacity: isDark ? 0.05 : 0.03, pointerEvents: "none",
        backgroundImage: `linear-gradient(${RDC_BLUE} 1px, transparent 1px), linear-gradient(90deg, ${RDC_BLUE} 1px, transparent 1px)`,
        backgroundSize: "30px 30px"
      }} />

      <Container maxWidth="md" sx={{ position: "relative", zIndex: 1 }}>
        
        {/* Header Institutionnel */}
        <Paper elevation={0} sx={{ 
          p: 3, mb: 3, borderRadius: "20px", 
          bgcolor: alpha(theme.palette.background.paper, 0.8),
          backdropFilter: "blur(10px)",
          border: `1px solid ${alpha(RDC_BLUE, 0.2)}`
        }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Box component="img" src={sceauRdc} sx={{ height: 60 }} />
            <Box textAlign="center">
              <Typography variant="subtitle2" fontWeight={900} color={RDC_BLUE} sx={{ letterSpacing: 1.5 }}>
                RÉPUBLIQUE DÉMOCRATIQUE DU CONGO
              </Typography>
              <Typography variant="h6" fontWeight={800} color={isDark ? "#fff" : "#000"}>
                SERVICES MÉDICAUX CARCÉRAUX
              </Typography>
            </Box>
            <Avatar src={drapeauRdc} sx={{ width: 50, height: 50, border: `2px solid ${RDC_YELLOW}` }} />
          </Stack>
        </Paper>

        {/* Formulaire Principal */}
        <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}>
          <Paper elevation={24} sx={{ 
            p: 4, borderRadius: "24px",
            bgcolor: alpha(theme.palette.background.paper, 0.9),
            border: `1px solid ${alpha(RDC_RED, 0.3)}`,
            position: "relative"
          }}>
            
            {/* Indicateur de statut médical */}
            <Box sx={{ 
              position: "absolute", top: -15, right: 30, 
              bgcolor: RDC_RED, color: "#fff", px: 2, py: 0.5, 
              borderRadius: "10px", boxShadow: `0 4px 15px ${alpha(RDC_RED, 0.4)}`,
              display: "flex", alignItems: "center", gap: 1
            }}>
              <LocalHospital fontSize="small" />
              <Typography variant="caption" fontWeight={900}>DÉCLARATION MÉDICO-LÉGALE</Typography>
            </Box>

            <Stack spacing={4}>
              
              {/* Section Recherche */}
              <Box>
                <Typography variant="overline" color={RDC_BLUE} fontWeight={900}>Identification du Sujet</Typography>
                <Autocomplete
                  options={detenus}
                  getOptionLabel={(option) => `${option.nom} ${option.prenom} [${option.matricule}]`}
                  onChange={(e, val) => setSelectedDetenu(val)}
                  renderInput={(params) => (
                    <TextField 
                      {...params} 
                      placeholder="Scanner ou rechercher le matricule..." 
                      variant="filled"
                      sx={{ mt: 1, "& .MuiFilledInput-root": { borderRadius: "12px", bgcolor: alpha(RDC_BLUE, 0.05) } }}
                      InputProps={{ 
                        ...params.InputProps, 
                        startAdornment: <Search sx={{ color: RDC_BLUE, ml: 1 }} /> 
                      }} 
                    />
                  )}
                />
              </Box>

              {/* Card du détenu sélectionné */}
              <AnimatePresence>
                {selectedDetenu && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}>
                    <Box sx={{ 
                      p: 2, borderRadius: "16px", 
                      bgcolor: alpha(RDC_BLUE, 0.05), 
                      border: `1px solid ${alpha(RDC_BLUE, 0.1)}`,
                      display: "flex", alignItems: "center", justifyContent: "space-between"
                    }}>
                      <Stack direction="row" spacing={2} alignItems="center">
                        <Badge color="error" overlap="circular" badgeContent="!" invisible={!selectedDetenu}>
                          <Avatar sx={{ bgcolor: RDC_BLUE, width: 56, height: 56 }}>{selectedDetenu.nom[0]}</Avatar>
                        </Badge>
                        <Box>
                          <Typography variant="h6" fontWeight={800}>{selectedDetenu.nom} {selectedDetenu.prenom}</Typography>
                          <Typography variant="body2" sx={{ opacity: 0.7 }}>Matricule: <b>{selectedDetenu.matricule}</b> • Pavillon: {selectedDetenu.pavillon || "A"}</Typography>
                        </Box>
                      </Stack>
                      <Chip icon={<HealthAndSafety />} label="Dossier Actif" color="primary" variant="outlined" />
                    </Box>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Constat Médical */}
              <Box>
                <Typography variant="overline" color={RDC_BLUE} fontWeight={900}>Observations Médicales</Typography>
                <TextField 
                  fullWidth multiline rows={4} 
                  placeholder="Décrire avec précision les causes et circonstances constatées..." 
                  value={cause}
                  onChange={(e) => setCause(e.target.value)}
                  sx={{ mt: 1, "& .MuiOutlinedInput-root": { borderRadius: "16px" } }}
                />
              </Box>

              {/* Upload avec style High-Tech */}
              <Stack direction="row" spacing={2} alignItems="center">
                <Button 
                  component="label" 
                  variant="outlined" 
                  startIcon={<UploadFile />}
                  sx={{ borderRadius: "12px", borderWidth: 2, p: 1.5, flex: 1 }}
                >
                  Scanner le Certificat
                  <input type="file" hidden onChange={(e) => setCertificat(e.target.files[0])} />
                </Button>
                
                {certificat && (
                   <Chip 
                    label={certificat.name} 
                    onDelete={() => setCertificat(null)}
                    sx={{ bgcolor: alpha(RDC_YELLOW, 0.2), fontWeight: 700 }}
                   />
                )}
              </Stack>

              <Divider sx={{ borderStyle: "dashed" }} />

              {/* Bouton de Validation */}
              <Button 
                variant="contained" 
                size="large" 
                onClick={handleDeclare} 
                disabled={loading || !selectedDetenu}
                sx={{ 
                  bgcolor: RDC_RED, 
                  color: "#fff",
                  fontWeight: 900, 
                  py: 2, 
                  borderRadius: "16px",
                  boxShadow: `0 10px 20px ${alpha(RDC_RED, 0.3)}`,
                  "&:hover": { bgcolor: "#b00e20", transform: "translateY(-2px)" },
                  transition: "all 0.3s"
                }}
              >
                {loading ? <CircularProgress size={26} color="inherit" /> : "TRANSMETTRE LE RAPPORT À LA DIRECTION"}
              </Button>
            </Stack>
          </Paper>
        </motion.div>

        {/* Footer */}
        <Typography variant="caption" sx={{ display: "block", textAlign: "center", mt: 4, opacity: 0.5, fontWeight: 700 }}>
          SYSTÈME NUMÉRIQUE DE LA JUSTICE • RDC • DÉLÉGATION MÉDICALE
        </Typography>
      </Container>
    </Box>
  );
};

export default DashboardMedecin;