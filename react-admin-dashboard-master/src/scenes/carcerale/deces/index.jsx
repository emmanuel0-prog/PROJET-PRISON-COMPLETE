import React, { useState, useEffect } from "react";
import { 
  Box, Typography, Paper, Stack, Button, TextField, 
  Autocomplete, Divider, Container, Avatar, CircularProgress,
  IconButton, InputAdornment 
} from "@mui/material";
import { 
  LocalHospital, Search, UploadFile, Description, 
  PersonOff, EditNote 
} from "@mui/icons-material";
import api from "../../../api";

const RDC_BLUE = "#007FFF";
const RDC_RED = "#CE1126";

const DashboardMedecin = () => {
  const [detenus, setDetenus] = useState([]);
  const [selectedDetenu, setSelectedDetenu] = useState(null);
  const [cause, setCause] = useState("");
  const [certificat, setCertificat] = useState(null);
  const [loading, setLoading] = useState(false);

  // Charger les détenus pour l'autocomplete
  useEffect(() => {
    const fetchDetenus = async () => {
      const res = await api.get("/detenus/");
      setDetenus(res.data);
    };
    fetchDetenus();
  }, []);

  const handleDeclare = async () => {
    if (!selectedDetenu || !cause) return alert("Veuillez remplir les champs obligatoires");
    
    setLoading(true);
    const formData = new FormData();
    formData.append("detenu", selectedDetenu.id);
    formData.append("cause", cause);
    if (certificat) formData.append("certificat", certificat);

    try {
      await api.post("/deces/", formData, { 
        headers: { "Content-Type": "multipart/form-data" } 
      });
      alert("Déclaration transmise à la Direction.");
      setSelectedDetenu(null);
      setCause("");
      setCertificat(null);
    } catch (err) {
      alert("Erreur lors de la déclaration");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="md" sx={{ mt: 4 }}>
      <Paper elevation={3} sx={{ p: 4, borderRadius: "20px", borderTop: `5px solid ${RDC_RED}` }}>
        <Stack direction="row" alignItems="center" spacing={2} mb={4}>
          <Box sx={{ p: 2, bgcolor: "#fce4e4", borderRadius: "10px", color: RDC_RED }}>
             <LocalHospital fontSize="large" />
          </Box>
          <Box>
            <Typography variant="h5" fontWeight={900}>UNITÉ MÉDICALE PÉNITENTIAIRE</Typography>
            <Typography variant="caption" sx={{ color: "text.secondary" }}>Procédure de constatation de décès</Typography>
          </Box>
        </Stack>

        <Stack spacing={3}>
          {/* Recherche Intelligente */}
          <Autocomplete
            options={detenus}
            getOptionLabel={(option) => `${option.nom} ${option.prenom} - ${option.matricule}`}
            onChange={(e, val) => setSelectedDetenu(val)}
            renderInput={(params) => (
              <TextField {...params} label="Rechercher le détenu" variant="outlined" 
                InputProps={{ ...params.InputProps, startAdornment: <Search sx={{ mr: 1, color: RDC_BLUE }} /> }} 
              />
            )}
          />

          {selectedDetenu && (
             <Box sx={{ p: 2, bgcolor: "#f5f5f5", borderRadius: "10px", display: "flex", alignItems: "center" }}>
                <Avatar sx={{ mr: 2, bgcolor: RDC_BLUE }}>{selectedDetenu.nom[0]}</Avatar>
                <Box>
                    <Typography fontWeight={700}>{selectedDetenu.nom} {selectedDetenu.prenom}</Typography>
                    <Typography variant="caption">Matricule: {selectedDetenu.matricule} | Cellule: {selectedDetenu.cellule}</Typography>
                </Box>
             </Box>
          )}

          <TextField 
            fullWidth multiline rows={4} label="Cause médicale du décès" 
            value={cause} onChange={(e) => setCause(e.target.value)}
          />

          <Button component="label" variant="outlined" startIcon={<UploadFile />}>
            Joindre le Certificat de Décès (PDF/Image)
            <input type="file" hidden onChange={(e) => setCertificat(e.target.files[0])} />
          </Button>
          
          {certificat && (
             <Chip label={certificat.name} icon={<Description />} onDelete={() => setCertificat(null)} />
          )}

          <Divider />

          <Button 
            variant="contained" size="large" onClick={handleDeclare} disabled={loading}
            sx={{ bgcolor: RDC_RED, fontWeight: 900, py: 1.5, "&:hover": { bgcolor: "#9e0d1d" } }}
          >
            {loading ? <CircularProgress size={24} color="inherit" /> : "VALIDER ET TRANSMETTRE À LA DIRECTION"}
          </Button>
        </Stack>
      </Paper>
    </Container>
  );
};

export default DashboardMedecin;